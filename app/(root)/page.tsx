import { BASE_PATH } from "@/lib/paths";

/*
 * "/" has no content of its own. It forwards to /en/ or /ar/ in the browser, so it
 * works on static hosting: the language the visitor last chose wins, then the first
 * of English or Arabic in their browser's language list, then English.
 */
const script = `(function(){
  var base = ${JSON.stringify(BASE_PATH)};
  var saved = (document.cookie.match(/(?:^|; )lang=(en|ar)/) || [])[1];
  var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
  var pick = saved;
  for (var i = 0; !pick && i < langs.length; i++) {
    var b = String(langs[i]).toLowerCase().slice(0, 2);
    if (b === "ar" || b === "en") pick = b;
  }
  location.replace(base + "/" + (pick || "en") + "/" + location.hash);
})();`;

export default function RootRedirect() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: script }} />
      <noscript>
        <a href={`${BASE_PATH}/en/`}>English</a> · <a href={`${BASE_PATH}/ar/`}>العربية</a>
      </noscript>
    </>
  );
}
