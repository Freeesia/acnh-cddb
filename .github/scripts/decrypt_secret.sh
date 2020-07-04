#!/bin/sh

LARGE_SECRET_PASSPHRASE=$1
INPUT_PATH=$2
OUTPUT_NAME=$(basename ${INPUT_PATH%.gpg})

# Decrypt the file
mkdir $HOME/secrets
# --batch to prevent interactive command
# --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$LARGE_SECRET_PASSPHRASE" \
--output $HOME/secrets/$OUTPUT_NAME $INPUT_PATH
