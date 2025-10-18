#!/usr/bin/env bash
set -euo pipefail

# Installs required runtime packages when working offline.
# The script expects pre-downloaded npm tarballs either in a local cache
# directory or within a bundled archive that ships with the project.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
CACHE_DIR="${LOCAL_CACHE_DIR:-"$ROOT_DIR/.npm-offline-cache"}"
BUNDLED_ARCHIVE="${BUNDLED_TARBALL:-"$ROOT_DIR/offline-deps.tar.gz"}"

# Packages that must be available for the offline build.
PACKAGES=(
  "react"
  "react-dom"
  "react-router-dom"
  "dexie"
  "zod"
  "react-markdown"
  "unified"
  "remark-parse"
)

log() {
  printf '\n[install-offline] %s\n' "$1"
}

warn() {
  printf '[install-offline] warning: %s\n' "$1" >&2
}

err() {
  printf '[install-offline] error: %s\n' "$1" >&2
  exit 1
}

normalise_version() {
  local version="$1"
  version="${version#^}"
  version="${version#~}"
  echo "$version"
}

resolve_tarball_path() {
  local pkg="$1"
  local version="$2"
  local tarball

  # Look for matching files in the cache directory.
  if [[ -d "$CACHE_DIR" ]]; then
    while IFS= read -r -d '' candidate; do
      tarball="$candidate"
      break
    done < <(find "$CACHE_DIR" -maxdepth 2 -type f \
      \( -name "${pkg}-${version}.tgz" -o -name "${pkg}-${version}.tar.gz" \) -print0)

    if [[ -n "${tarball:-}" ]]; then
      echo "$tarball"
      return 0
    fi
  fi

  return 1
}

ensure_cache_unpacked() {
  if [[ ! -d "$CACHE_DIR" && -f "$BUNDLED_ARCHIVE" ]]; then
    log "Extracting bundled archive $BUNDLED_ARCHIVE"
    mkdir -p "$CACHE_DIR"
    tar -xf "$BUNDLED_ARCHIVE" -C "$CACHE_DIR"
  fi
}

main() {
  if ! command -v npm >/dev/null 2>&1; then
    err "npm must be installed to use this script."
  fi

  if ! command -v node >/dev/null 2>&1; then
    err "node must be installed to resolve dependency versions."
  fi

  ensure_cache_unpacked

  for pkg in "${PACKAGES[@]}"; do
    log "Processing $pkg"

    local version
    version="$(node -p "(require('$ROOT_DIR/package.json').dependencies || {})['$pkg'] || (require('$ROOT_DIR/package.json').devDependencies || {})['$pkg'] || ''")"

    if [[ -z "$version" ]]; then
      warn "No version found for $pkg in package.json; skipping."
      continue
    fi

    version="$(normalise_version "$version")"

    local tarball_path
    if ! tarball_path="$(resolve_tarball_path "$pkg" "$version")"; then
      # Try refreshing the cache by unpacking the bundled archive (if it exists)
      # in case it was created after the first check.
      if [[ -f "$BUNDLED_ARCHIVE" ]]; then
        ensure_cache_unpacked
        tarball_path="$(resolve_tarball_path "$pkg" "$version" || true)"
      fi
    fi

    if [[ -z "${tarball_path:-}" ]]; then
      err "Unable to locate a tarball for $pkg@$version. Provide it in $CACHE_DIR or $BUNDLED_ARCHIVE."
    fi

    log "Installing from $tarball_path"
    npm install --no-save "$tarball_path"
  done

  log "Offline dependency installation complete."
}

main "$@"
