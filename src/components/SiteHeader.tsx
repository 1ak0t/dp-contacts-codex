import logoUrl from "../../dp-logo.svg";
export default function SiteHeader() {
  return (
    <header className="siteHeader">
      <img className="siteLogo" src={logoUrl} alt="Деталь проект" />
      <h1>Адресная книга ООО "Деталь проект"</h1>
    </header>
  );
}
