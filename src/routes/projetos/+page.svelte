<svelte:head>
  <title>Meus Projetos</title>
</svelte:head>

<script>
  import * as d3 from 'd3';
  import projects from "$lib/projects.json";
  import Project from "$lib/Project.svelte";
  import Pie from '$lib/Pie.svelte';

  // Códigos do gráfico de pizza
  let rolledData = d3.rollups(projects, v => v.length, d => d.year);

  let pieData;

    $: {
        // Initialize to an empty object every time this runs
        pieData = {};
        
        // Calculate rolledData and pieData based on filteredProjects here
        let rolledData = d3.rollups(filteredProjects, v => v.length, d => d.year);

        // We don't need 'let' anymore since we already defined pieData
        pieData = rolledData.map(([year, count]) => {
            return { value: count, label: year };
        });
    }
    

    
    // Parte da pesquisa
    let query = "";
    $: filteredProjects = projects.filter(project => {
      let values = Object.values(project).join("\n").toLowerCase();
      return values.includes(query.toLowerCase());
    });
    
    let selectedYearIndex = -1;
    let selectedYear;
    $: selectedYear = selectedYearIndex > -1 ? pieData[selectedYearIndex].label : null;
    
    $: filteredByYear = filteredProjects.filter(project => {
          if (selectedYear) {
              return project.year === selectedYear;
          }
  
          return true;
      });
  
</script>

  <Pie data={pieData} bind:selectedIndex={selectedYearIndex} />
  <input 
    type="search" 
    bind:value={query} 
    aria-label="Search projects" 
    placeholder="🔍 Search projects..." 
    class="search-input" 
  />


    <div class="titulo-apresentacao">
        <div class="text-container">
            <h1>Meus Projetos</h1>
            <p>Confira alguns dos meus projetos mais recentes</p>
        </div>
    </div>      
    

    <!-- Projetos -->
    <div class="container">
    
    { filteredByYear.length } projetos

    {#each filteredByYear.slice(0, 5) as p}
    <Project data={p} />
    {/each}
    </div>

  <style>
    .search-input {
        display: block;
        margin: 0 auto; /* Centraliza horizontalmente */
    }
</style>