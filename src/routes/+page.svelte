<svelte:head>
  <title>Bem-Vindo</title>
</svelte:head>

<script>
  import projects from "$lib/projects.json";
  import Project from "$lib/Project.svelte";

  let profileData = fetch("https://api.github.com/users/gustyper");
</script>

<div class="background">
  <!-- Usando o GIF local -->
  <img src="images/giphy.gif" alt="GIF Background">
</div>

<div class="contentHome">
  <h1>Gustavo Bianchi da Silva</h1>
  <p>FGV EMAp</p>
  <p>Visualização de Dados</p>
</div>

<!-- Status do GitHub -->
<div class="github-stats">
  {#await fetch("https://api.github.com/users/gustyper")}
    <p>Loading...</p>
  {:then response}
    {#await response.json()}
      <p>Decoding...</p>
    {:then data}
      <section>
        <h2>GitHub Stats</h2>
        <dl>
          <dt>Followers</dt>
          <dd>{data.followers}</dd>
          <dt>Following</dt>
          <dd>{data.following}</dd>
          <dt>Public Repos</dt>
          <dd>{data.public_repos}</dd>
        </dl>
      </section>
    {:catch error}
      <p class="error">Something went wrong: {error.message}</p>
    {/await}
  {:catch error}
    <p class="error">Something went wrong: {error.message}</p>
  {/await}
</div>

<style>
  /* Estilo para o conteúdo principal, já fornecido */
  .contentHome {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: white;
    font-size: 2rem;
    z-index: 10; /* Garante que o conteúdo fique acima do fundo */
  }

  .contentHome h1 {
    font-size: 3rem;
    margin: 0;
  }

  .contentHome p {
    font-size: 1.2rem;
    margin-top: 10px;
  }

  /* Estilo para a seção de status do GitHub */
  .github-stats {
    position: absolute;
    top: 60%; /* Define a posição logo abaixo do nome */
    left: 50%;
    transform: translateX(-50%); /* Centraliza horizontalmente */
    text-align: center;
    color: white;
    font-size: 1.5rem;
    z-index: 10;
  }

  .github-stats h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .github-stats dl {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 1.2rem;
  }

  .github-stats dt {
    font-weight: bold;
    margin-top: 5px;
  }

  .github-stats dd {
    font-weight: normal;
    margin-bottom: 10px;
  }

  /* Estilo para o erro */
  .error {
    color: red;
    font-size: 1.2rem;
  }
</style>
