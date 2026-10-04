#!/usr/bin/env bash
# Placeholder character clips on a green screen, until the real Kling / Veo
# clips arrive. Simple shapes stand in for Maria (coral) and Ari (amber);
# dialogue uses macOS voices. Usage: scripts/make-placeholder-clips.sh [IDs...]
set -euo pipefail
OUT=public/story/clips/placeholder
mkdir -p "$OUT"
TMP=$(mktemp -d)
GREEN=0x00B140

# This ffmpeg build has no drawtext, so labels are a no-op (the player shows captions).
label() { echo "null"; }

# Maria standing (full body), centre x = $1 (expression), optional arm
maria_full() {
  local cx="${1//,/\\,}"
  echo "drawbox=x=($cx)-90:y=330:w=180:h=560:color=0xFF6F4F:t=fill,drawbox=x=($cx)-65:y=170:w=130:h=150:color=0xF2C9A0:t=fill,drawbox=x=($cx)-70:y=150:w=140:h=55:color=0x3B2A20:t=fill"
}
# Ari sitting (full body), centre x = $1
ari_full() {
  local cx="${1//,/\\,}"
  echo "drawbox=x=($cx)-110:y=720:w=220:h=170:color=0xF5A524:t=fill,drawbox=x=($cx)-60:y=610:w=120:h=120:color=0xF5A524:t=fill,drawbox=x=($cx)-45:y=575:w=25:h=45:color=0xF5A524:t=fill,drawbox=x=($cx)+20:y=575:w=25:h=45:color=0xF5A524:t=fill,drawbox=x=($cx)-60:y=700:w=120:h=14:color=0x12B5A6:t=fill"
}
# Maria waist-up
maria_waist() {
  echo "drawbox=x=760:y=470:w=400:h=610:color=0xFF6F4F:t=fill,drawbox=x=830:y=170:w=260:h=300:color=0xF2C9A0:t=fill,drawbox=x=820:y=130:w=280:h=100:color=0x3B2A20:t=fill"
}
# Mouth that moves while talking
mouth() { echo "drawbox=x=$1:y=$2:w=70:h='12+20*abs(sin(t*18))':color=0x7A2E2E:t=fill"; }

speak() { # $1 voice, $2 rate, $3 text, $4 out.aiff
  say -v "$1" -r "$2" -o "$4" "$3"
}

clip() { # $1 id, $2 seconds, $3 video filter, [$4 audio file]
  local id=$1 dur=$2 vf=$3 audio=${4:-}
  if [ -n "$audio" ]; then
    ffmpeg -y -loglevel error -f lavfi -i "color=c=$GREEN:s=1920x1080:r=30:d=$dur" -i "$audio" \
      -vf "$vf" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 128k -t "$dur" "$OUT/$id.mp4"
  else
    ffmpeg -y -loglevel error -f lavfi -i "color=c=$GREEN:s=1920x1080:r=30:d=$dur" -f lavfi -i "anullsrc=r=44100:cl=stereo" \
      -vf "$vf" -c:v libx264 -pix_fmt yuv420p -c:a aac -t "$dur" "$OUT/$id.mp4"
  fi
  echo "$OUT/$id.mp4"
}

talk() { # $1 id, $2 voice, $3 rate, $4 text, $5 base filter, $6 mouth x, $7 mouth y, $8 label
  local a="$TMP/$1.aiff"
  speak "$2" "$3" "$4" "$a"
  local d; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$a")
  d=$(python3 -c "print(round($d + 0.8, 2))")
  clip "$1" "$d" "$5,$(mouth "$6" "$7"),$(label "$8")" "$a"
}

MARIA_VOICE=Samantha
ARI_VOICE=Junior

make() {
  case "$1" in
    M01) clip M01 6 "$(maria_full 'min(960, -200 + t*300)'),$(label 'M01 · Maria walks in (placeholder)')" ;;
    M02) talk M02 $MARIA_VOICE 185 "Hi! I'm Maria. I've been the procurement manager here at Northwind for eight years... and this is one of my last days." "$(maria_waist)" 925 380 "M02 · Maria says hi (placeholder)" ;;
    *) echo "unknown clip $1" >&2 ;;
  esac
}

IDS=("$@")
[ ${#IDS[@]} -eq 0 ] && IDS=(M01 M02)
for id in "${IDS[@]}"; do make "$id"; done
rm -rf "$TMP"
