#!/bin/sh
# Runs when the container starts: writes the school colors from the environment to a stylesheet.
# Equal to scripts/theme.mjs; a test compares them.

theme() {
	hex=${3#\#}
	case $hex in
	*[!0-9a-fA-F]*) ;;
	??? | ??????)
		printf ':root{--theme-%s:#%s}\n' "$1" "$hex"
		return
		;;
	esac
	[ -z "$3" ] || echo "$2 is ignored: \"$3\" is not a hex color such as #1d3fbb" >&2
}

{
	theme light THEME_COLOR_LIGHT "${THEME_COLOR_LIGHT:-}"
	theme dark THEME_COLOR_DARK "${THEME_COLOR_DARK:-}"
} >"${1:-/tmp/theme.css}"
