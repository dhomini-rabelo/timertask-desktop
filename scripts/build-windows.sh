#!/usr/bin/env bash
# Build the Windows (x86_64-pc-windows-msvc) bundle from a Linux/WSL host.
#
# Cross-compiling to the MSVC target needs three things that are not part of a
# stock Linux box, all installed under $HOME (no sudo required):
#
#   1. cargo-xwin  -> downloads the MSVC CRT + Windows SDK and injects the
#                     include/lib paths (cached in ~/.cache/cargo-xwin)
#   2. LLVM        -> clang-cl (preprocesses the .rc file), llvm-rc (compiles
#                     it: icon + version info) and lld-link (the linker)
#   3. makensis    -> tauri's NSIS bundler shells out to it to build the
#                     installer. tauri-cli hardcodes NSISDIR=/usr/share/nsis on
#                     Linux, so ~/.local/xbin/makensis is a wrapper that points
#                     NSISDIR back at the local prefix.
#
# Run scripts/setup-windows-cross.sh once to provision all of the above.
#
# MSI is skipped on purpose: the WiX toolchain only runs on a Windows host, so
# tauri logs "ignoring msi" and emits the NSIS installer only.
set -euo pipefail

cd "$(dirname "$0")/.."

LLVM_BIN="$HOME/.local/llvmroot/usr/lib/llvm-14/bin"
export PATH="$HOME/.cargo/bin:$HOME/.local/xbin:$LLVM_BIN:$PATH"
export LD_LIBRARY_PATH="$HOME/.local/llvmroot/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

missing=()
for tool in cargo cargo-xwin clang-cl llvm-rc lld-link makensis; do
  command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
done
if [ ${#missing[@]} -gt 0 ]; then
  echo "missing tool(s): ${missing[*]}" >&2
  echo "run scripts/setup-windows-cross.sh first" >&2
  exit 1
fi

# The MSVC CRT import libs ship without their PDBs, so lld-link emits an
# LNK4099 per object; silence it so real linker errors stay visible.
export RUSTFLAGS="${RUSTFLAGS:-} -C link-arg=/ignore:4099"

exec npm run tauri -- build --runner cargo-xwin --target x86_64-pc-windows-msvc "$@"
