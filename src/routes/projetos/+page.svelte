<svelte:head>
  <title>Meus Projetos</title>
</svelte:head>

<script>
  import projects from "$lib/projects.json";
  import Project from "$lib/Project.svelte";
</script>


    <div class="titulo-apresentacao">
        <div class="text-container">
            <h1>Meus Projetos</h1>
            <p>Confira alguns dos meus projetos mais recentes</p>
        </div>
    </div>      
    

    <!-- Projetos -->
    <div class="container">
    
    { projects.length } projetos

    {#each projects.slice(0, 5) as p}
    <Project data={p} />
    {/each}
    </div>