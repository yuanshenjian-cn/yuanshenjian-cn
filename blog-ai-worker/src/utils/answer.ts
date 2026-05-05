export function createAnswerDeltaSanitizer(onDelta: (delta: string) => void) {
  let pendingHyphen = false;

  return {
    push(delta: string) {
      if (!delta) {
        return;
      }

      let sanitized = "";

      for (const char of delta) {
        if (pendingHyphen) {
          if (char === "-") {
            sanitized += "——";
            pendingHyphen = false;
            continue;
          }

          sanitized += "-";
          pendingHyphen = false;
        }

        if (char === "-") {
          pendingHyphen = true;
          continue;
        }

        sanitized += char;
      }

      if (sanitized) {
        onDelta(sanitized);
      }
    },
    finish() {
      if (!pendingHyphen) {
        return;
      }

      pendingHyphen = false;
      onDelta("-");
    },
  };
}
