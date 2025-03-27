<script>
    export let data = {};
    export let hLevel = 2;
</script>

<div class="project">
  <svelte:element this={"h" + hLevel}>{data.title}</svelte:element>

  <div class="comfoto">
    <img src={data.image} alt={data.title} />

    <div class="text-container">
      <p>{data.description}</p>
    </div>
  </div>
</div>


