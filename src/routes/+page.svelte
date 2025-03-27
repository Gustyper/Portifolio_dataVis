<svelte:head>
  <title>Bem-Vindo</title>
</svelte:head>

<script>
  import projects from "$lib/projects.json";
  import Project from "$lib/Project.svelte";
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


<div class="projects-container" style="display: none;">
  {#each projects.slice(0, 3) as p}
    <Project data={p} hLevel="3" />
  {/each}
</div>
