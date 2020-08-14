export type LineSepOption = "lf" | "\n" | "crlf" | "\r\n" | "auto";

function getRawLinesSep(option: LineSepOption) {
  switch (option) {
    case "\n":
    case "lf":
      return "\n";
    case "\r\n":
    case "crlf":
      return "\r\n";
    default:
      return option;
  }
}

export function getLineSepSplitter(option: LineSepOption): RegExp | string {
  const raw = getRawLinesSep(option);
  return raw === "auto" ? /\r?\n/ : raw;
}

function isWin() {
  return process.platform === "win32";
}

export function getLineSepString(option: LineSepOption): string {
  const raw = getRawLinesSep(option);
  return raw === "auto"
    ? //
      isWin()
      ? "\r\n"
      : "\n"
    : raw;
}
