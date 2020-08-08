export function getPlainText(text: string) {
  return (
    text
      // ハッシュタグとURLを削除
      .replace(/(＃|#|https?:\/\/).*?(\s+|$)/g, "")
      // 空行削除
      .replace(/\n+/g, "\n")
      // 最後の空行削除
      .replace(/\n(\s+)?$/, "")
      .replace("&lt;", "<")
      .replace("&gt;", ">")
      .replace("&amp;", "&")
      .replace("&apos;", "'")
      .replace("&quot;", '"')
      .replace("&nbsp;", "\xa0")
  );
}
