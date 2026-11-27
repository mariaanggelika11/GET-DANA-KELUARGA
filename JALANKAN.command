#!/bin/zsh
# Klik dua kali untuk menyiapkan dan membuka website Dana Keluarga.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
  fi
fi
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  print 'Node.js dan npm belum ditemukan. Pasang Node.js minimal 22.13, lalu buka file ini kembali.'
  read 'reply?Tekan Enter untuk menutup...'
  exit 1
fi
npm run start
result=$?
if [ "$result" -ne 0 ] && [ "$result" -ne 130 ]; then
  print '\nWebsite belum dapat dijalankan. Periksa pesan di atas.'
  read 'reply?Tekan Enter untuk menutup...'
fi
exit "$result"
