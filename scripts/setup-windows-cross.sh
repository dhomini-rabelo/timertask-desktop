#!/usr/bin/env bash
# One-time provisioning for Windows cross-compilation from Linux/WSL.
# Everything lands under $HOME, so no sudo is needed. Idempotent.
#
# If you do have root, the equivalent is much shorter:
#   sudo apt install -y clang llvm lld nsis
#   curl https://sh.rustup.rs -sSf | sh
#   rustup target add x86_64-pc-windows-msvc && cargo install cargo-xwin
# in which case scripts/build-windows.sh works as-is (the PATH entries it adds
# are simply ignored) and the makensis wrapper is unnecessary.
set -euo pipefail

XWIN_VERSION=0.23.1
LLVM_MAJOR=14
LOCAL_BIN="$HOME/.local/xbin"
LLVM_ROOT="$HOME/.local/llvmroot"
LLVM_BIN="$LLVM_ROOT/usr/lib/llvm-$LLVM_MAJOR/bin"
NSIS_PREFIX="$HOME/.local/nsis"
NSIS_REAL_BIN="$HOME/.local/nsis-bin"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$LOCAL_BIN" "$NSIS_REAL_BIN"
export PATH="$HOME/.cargo/bin:$LOCAL_BIN:$LLVM_BIN:$PATH"

# 1. Rust toolchain + MSVC target ---------------------------------------------
if ! command -v cargo >/dev/null 2>&1; then
  echo "==> installing rustup"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --default-toolchain stable --profile minimal --no-modify-path
fi
echo "==> adding x86_64-pc-windows-msvc target"
rustup target add x86_64-pc-windows-msvc

# rust-lld doubles as lld-link (LLD dispatches on argv[0]), which keeps the
# linker in sync with rustc instead of relying on the older packaged LLD.
RUST_LLD="$(rustc --print sysroot)/lib/rustlib/x86_64-unknown-linux-gnu/bin/rust-lld"
[ -x "$RUST_LLD" ] && ln -sf "$RUST_LLD" "$LOCAL_BIN/lld-link"

# 2. cargo-xwin (MSVC CRT + Windows SDK provider) -----------------------------
if ! command -v cargo-xwin >/dev/null 2>&1; then
  echo "==> installing cargo-xwin $XWIN_VERSION"
  curl -sSL -o "$WORK/xwin.tar.gz" \
    "https://github.com/rust-cross/cargo-xwin/releases/download/v$XWIN_VERSION/cargo-xwin-v$XWIN_VERSION.x86_64-unknown-linux-musl.tar.gz"
  tar xzf "$WORK/xwin.tar.gz" -C "$WORK"
  install -m755 "$WORK/cargo-xwin" "$HOME/.cargo/bin/cargo-xwin"
fi

# 3. LLVM: clang-cl (.rc preprocessing) + llvm-rc (.rc compilation) -----------
if [ ! -x "$LLVM_BIN/llvm-rc" ]; then
  echo "==> installing llvm/clang $LLVM_MAJOR into $LLVM_ROOT"
  mkdir -p "$WORK/llvm" && (
    cd "$WORK/llvm"
    apt-get download \
      "clang-$LLVM_MAJOR" "llvm-$LLVM_MAJOR" "libllvm$LLVM_MAJOR" \
      "libclang-cpp$LLVM_MAJOR" "libclang-common-$LLVM_MAJOR-dev" \
      "llvm-$LLVM_MAJOR-linker-tools" "lld-$LLVM_MAJOR" libz3-4
    mkdir -p root
    for deb in *.deb; do dpkg -x "$deb" root; done
  )
  rm -rf "$LLVM_ROOT"
  mkdir -p "$LLVM_ROOT"
  cp -a "$WORK/llvm/root/usr" "$LLVM_ROOT/"
fi
# clang in "cl" driver mode; Ubuntu's package omits the clang-cl alias.
ln -sf "clang-$LLVM_MAJOR" "$LLVM_BIN/clang-cl"

# 4. NSIS + wrapper -----------------------------------------------------------
if [ ! -x "$NSIS_REAL_BIN/makensis" ]; then
  echo "==> installing nsis into $NSIS_PREFIX"
  mkdir -p "$WORK/nsis" && (
    cd "$WORK/nsis"
    apt-get download nsis nsis-common
    mkdir -p root
    for deb in *.deb; do dpkg -x "$deb" root; done
  )
  mkdir -p "$NSIS_PREFIX"
  cp -a "$WORK/nsis/root/usr/share/nsis/." "$NSIS_PREFIX/"
  install -m755 "$WORK/nsis/root/usr/bin/makensis" "$NSIS_REAL_BIN/makensis"
fi
# tauri-cli hardcodes NSISDIR=/usr/share/nsis when it spawns makensis on a
# Linux host, which we cannot write to without root; repoint it here.
cat > "$LOCAL_BIN/makensis" <<'WRAPPER'
#!/bin/sh
NSISDIR="$HOME/.local/nsis"
NSISCONFDIR="$HOME/.local/nsis"
export NSISDIR NSISCONFDIR
exec "$HOME/.local/nsis-bin/makensis" "$@"
WRAPPER
chmod +x "$LOCAL_BIN/makensis"

echo
echo "toolchain ready:"
export LD_LIBRARY_PATH="$LLVM_ROOT/usr/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"
for tool in cargo cargo-xwin clang-cl llvm-rc lld-link makensis; do
  printf '  %-12s %s\n' "$tool" "$(command -v "$tool" || echo MISSING)"
done
echo
echo "now run: npm run build:win"
