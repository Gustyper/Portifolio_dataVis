<script>
    import { base } from "$app/paths";
    import { page } from "$app/stores";

    let pages = [
        { url: "/", title: "Home" },
        { url: "/projetos", title: "Projects" },
        { url: "/contato", title: "Contact" },
        { url: "/cv", title: "Resume" },
        { url: "/meta", title: "Meta" },
        {url: "https://github.com/Gustyper", title:"Github"}
    ];

    let localStorage = globalThis.localStorage ?? {};

    let colorScheme = localStorage.colorScheme
        ? localStorage.colorScheme
        : "light dark";
    
    let root = globalThis?.document?.documentElement;

    $: root?.style.setProperty("color-scheme", colorScheme);
</script>

<nav>
  {#each pages as p}
    <a
        href={p.url.startsWith("http") ? p.url: `${base}${p.url}`}
        class:current={$page.route.id === p.url}
        target={p.url.startsWith("http") ? "_blank" : undefined}
        >
        {p.title}
    </a>
  {/each}
</nav>

<label class="color-scheme">
    Theme:
    <select bind:value={ colorScheme }>
        <option value="light dark"> Automatic </option>
        <option value="light"> Light </option>
        <option value="dark"> Dark </option>
    </select>
</label>

<style>
    /* Estilo de navegação */
    nav {
        display: flex;
        justify-content: center;
        margin-top: 30px;
        margin-bottom: 20px;
        z-index: 100;
    }

    nav a {
        margin: 0 20px;
        text-align: center;
        font-weight: bold;
        color: #2c3e50;
        text-transform: uppercase;
        padding: 10px 20px;
        border-radius: 5px;
        transition: all 0.3s ease;
    }

    nav a:hover {
        background-color: #3498db;
        color: white;
        text-decoration: none;
    }

    /* Estilo para o tema Light */
    :root[color-scheme="light"] {
        background-color: #f4f4f4;
        color: #333;
    }

    /* Estilo para o tema Dark */
    :root[color-scheme="dark"] {
        background-color: #0d1117;
        color: #e5e5e5;
    }
</style>

<slot />