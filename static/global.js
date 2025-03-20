// alert("IT’S ALIVE!");

// function $$ (selector, context = document) {
//     return Array.from(context.querySelectorAll(selector));
// }

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(a => a.host === location.host && a.pathname === location.pathname);

// if (currentLink) { // or if (currentLink !== undefined)
//     currentLink.classList.add("current");
// }

// //o IF de cima pode ser escrito como:
// //currentLink?.classList.add("current");



//------------------------------------------ SEGUNDA PARTE (automatizar todo o nav)

const ARE_WE_HOME = document.documentElement.classList.contains("home");

let pages = [
    {url: ".", title: "Home"},
    {url: "projetos/", title: "Projects"},
    {url: "contato/", title: "Contato"},
    {url: "cv/", title: "Currículo"},
    {url: "https://github.com/Gustyper", title: "Github"},
    // add the rest of your pages here
];

let nav = document.createElement("nav");
document.body.prepend(nav);

// Coloca os links dentro dos navs
for (let p of pages) {
    let url = p.url;

    if (!ARE_WE_HOME && !url.startsWith("http")) {
        url = "../" + url;
    }

    let title = p.title;
    // Create link and add it to nav
    let a = document.createElement("a");
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add("current");
    }
    else if (a.host != location.host)
    {
        // Coloca o github pra abrir em outra página em branco
        a.target = "_blank"
    }

}

document.body.insertAdjacentHTML("afterbegin", `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Automatic</option>
        </select>
    </label>`
);

let select = document.querySelector("select");

select.addEventListener("input", function (event) {
    document.documentElement.style.setProperty("color-scheme", event.target.value);
});

localStorage.colorScheme = event.target.value;

alert(event.target.value)

if (localStorage.colorScheme) {
    document.documentElement.style.setProperty("color-scheme", localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}

// TODO terminar