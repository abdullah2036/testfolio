import { BASE_PATH } from "@/lib/paths";

/*
 * Pages without a language in the URL ("/", "/gallery/") forward to the English or
 * Arabic version in the browser, so this works on static hosting too: the language
 * the visitor last chose wins, then the first of English or Arabic in their
 * browser's language list, then English.
 */
export default function LangRedirect({ path = "" }: { path?: string }) {
  const script = `(function(){
  var base = ${JSON.stringify(BASE_PATH)};
  var saved = (document.cookie.match(/(?:^|; )lang=(en|ar)/) || [])[1];
  var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
  var pick = saved;
  for (var i = 0; !pick && i < langs.length; i++) {
    var b = String(langs[i]).toLowerCase().slice(0, 2);
    if (b === "ar" || b === "en") pick = b;
  }
  location.replace(base + "/" + (pick || "en") + "/" + ${JSON.stringify(path)} + location.hash);
})();`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <noscript>
        <a href={`${BASE_PATH}/en/${path}`}>English</a> · <a href={`${BASE_PATH}/ar/${path}`}>العربية</a>
      </noscript>
    </>
  );
}
