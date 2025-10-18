#!/usr/bin/env bash
set -euo pipefail

# Determine repository root relative to this script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

OUTPUT_DIR="${ROOT_DIR}/src/data/subjectExtracts"
ASSETS_DIR="${ROOT_DIR}/public/subject-assets"
SUBJECTS_DIR="${ROOT_DIR}/subjects"
EXTRACT_SCRIPT="${ROOT_DIR}/scripts/extract_subject_texts.py"

if [[ ! -d "${SUBJECTS_DIR}" ]]; then
  echo "subjects/ directory not found at ${SUBJECTS_DIR}" >&2
  exit 1
fi

echo "Removing existing subject extracts from ${OUTPUT_DIR}"
rm -rf "${OUTPUT_DIR}"

# Reset the public asset images so the extractor can rebuild them.
echo "Clearing generated subject asset images at ${ASSETS_DIR}"
rm -rf "${ASSETS_DIR}"
mkdir -p "${ASSETS_DIR}"

# Run the extractor once: it walks the entire subjects/ tree, including every PDF.
echo "Running subject extraction pipeline..."
python3 "${EXTRACT_SCRIPT}"

# Ensure that public image directories exist for each PDF subject.
# The extractor already populates these, but we create the folders explicitly so
# downstream tooling can rely on their presence even when image extraction yields
# no assets.
find "${SUBJECTS_DIR}" -type f -name '*.pdf' -print0 |
  while IFS= read -r -d '' pdf; do
    relative_path="${pdf#${SUBJECTS_DIR}/}"
    target_dir="${ASSETS_DIR}/${relative_path%.pdf}"
    mkdir -p "${target_dir}"
  done

echo "All subject extracts regenerated."
