<script>
    // Importações necessárias
    import * as d3 from "d3"; // D3.js para visualizações de dados
    import { onMount } from "svelte"; // Svelte onMount para execução após o carregamento do componente
    import { computePosition, autoPlacement, offset } from '@floating-ui/dom'; // Para posicionamento da tooltip
    import Bar from '$lib/Bar.svelte';

    // Definindo dimensões do gráfico
    let width = 1000, height = 600;
    let data = [];  // Armazena os dados do CSV
    let commits = [];  // Armazena os commits processados

    // Função chamada ao montar o componente, responsável por carregar os dados CSV
    onMount(async () => {
        try {
            // Carregamento assíncrono do arquivo CSV
            data = await d3.csv("./loc.csv", row => ({
                ...row, // Mantém os dados existentes
                line: Number(row.line), // Converte para número
                depth: Number(row.depth),
                length: Number(row.length),
                date: new Date(row.date + "T00:00" + row.timezone), // Converte data
                datetime: new Date(row.datetime)
            }));
        } catch (error) {
            console.error("Error loading CSV:", error); // Exibe erro caso falhe o carregamento
        }
    });

    // Processa os commits a partir dos dados carregados
    $: {
        // Agrupando os commits por ID
        commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {
            let first = lines[0];  // Pega o primeiro commit
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: "https://github.com/gusyper/lab4_dataVis/commit/" + commit,
                author, date, time, timezone, datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,  // Fracção de hora
                totalLines: lines.length  // Total de linhas alteradas nesse commit
            };

            // Definindo propriedade não enumerável "lines" para cada commit
            Object.defineProperty(ret, "lines", {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: false,
            });

            return ret;
        });

        // Ordena os commits pelo número de linhas alteradas (decrescente)
        commits = d3.sort(commits, d => -d.totalLines);
    }

    // Definindo margens e áreas utilizáveis para o gráfico
    let margin = { top: 10, right: 10, bottom: 30, left: 20 };
    let usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left
    };
    usableArea.width = usableArea.right - usableArea.left;
    usableArea.height = usableArea.bottom - usableArea.top;

    // Definindo escalas para o eixo X e Y
    $: minDate = d3.min(commits.map(d => d.date));
    $: maxDate = d3.max(commits.map(d => d.date));
    $: maxDatePlusOne = new Date(maxDate);
    $: maxDatePlusOne.setDate(maxDatePlusOne.getDate() + 1); // Aumenta 1 dia no máximo para incluir a data final

    let commitProgress = 100;
    $: timeScale = d3.scaleTime().domain([minDate,maxDate]).range([0,100]);
    $: commitMaxTime = timeScale.invert(commitProgress);
    $: filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime)
    $: filteredLines = data.filter(d => d.datetime <= commitMaxTime)

    // Escala para o eixo X (tempo)
    $: xScale = d3.scaleTime()
                .domain([minDate, maxDatePlusOne])
                .range([usableArea.left, usableArea.right])
                .nice();

    // Escala para o eixo Y (horas)
    $: yScale = d3.scaleLinear()
                .domain([24, 0])
                .range([usableArea.bottom, usableArea.top]);

    // Bindings de eixos (X e Y) para os elementos SVG
    let xAxis, yAxis;

    $: {
        // Atualiza os eixos com a escala definida
        d3.select(xAxis).call(d3.axisBottom(xScale));
        d3.select(yAxis).call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, "0") + ":00"));
    }

    // Gridlines no eixo Y
    let yAxisGridlines;

    $: {
        // Configura a grade para o eixo Y
        d3.select(yAxisGridlines).call(
            d3.axisLeft(yScale)
            .tickFormat("") // Remove rótulos
            .tickSize(-usableArea.width) // Desenha as linhas de grade no eixo X
        );
    }

    // Variáveis de estado para o hover e tooltip
    let hoveredIndex = -1;  // Indica o índice do commit selecionado
    $: hoveredCommit = filteredCommits[hoveredIndex] ?? hoveredCommit ?? {}; // Atualiza o commit com base no índice

    let cursor = { x: 0, y: 0 }; // Posições do cursor
    let commitTooltip; // Referência à tooltip
    let tooltipPosition = { x: 0, y: 0 }; // Posições da tooltip

    // Função para interações de hover e click nos commits (dots)
    async function dotInteraction(index, evt) {
        let hoveredDot = evt.target;
        if (evt.type === "mouseenter") {
            hoveredIndex = index;  // Atualiza o índice do commit
            cursor = { x: evt.x, y: evt.y };  // Atualiza posição do cursor
            tooltipPosition = await computePosition(hoveredDot, commitTooltip, {
                strategy: "fixed",  // Posição fixa da tooltip
                middleware: [
                    offset(5),  // Distância da tooltip em relação ao dot
                    autoPlacement() // Ajuste automático da posição da tooltip
                ],
            });
        } else if (evt.type === "mouseleave") {
            hoveredIndex = -1;  // Reseta o índice quando sai do hover
        } else if (evt.type === "click") {
            let commit = filteredCommits[index];
            if (!clickedCommits.includes(commit)) {
                // Adiciona o commit ao array de commits clicados
                clickedCommits = [...clickedCommits, commit];
            } else {
                // Remove o commit do array de commits clicados
                clickedCommits = clickedCommits.filter(c => c !== commit);
            }
        }
    }

    // Escala para o tamanho do círculo baseado no total de linhas alteradas
    $: rScale = d3.scaleSqrt()
                .domain(d3.extent(commits.map(d => d.totalLines)))
                .range([2, 30]);

    let clickedCommits = [];  // Array de commits clicados

    // Criação de um conjunto único de tipos de linha e contagem
    $: allTypes = Array.from(new Set(filteredLines.map(d => d.type)));  // Tipos únicos de linha
    $: selectedLines = (clickedCommits.length > 0 ? clickedCommits : filteredCommits).flatMap(d => d.lines);  // Linhas dos commits selecionados
    $: selectedCounts = d3.rollup(
        selectedLines,
        v => v.length,  // Contagem de linhas
        d => d.type  // Agrupamento por tipo
    );
    $: languageBreakdown = allTypes.map(type => [type, selectedCounts.get(type) || 0]);  // Quebra por tipo de linguagem
</script>

<!-- Exibição de informações gerais da página -->
<h2>META</h2>
<p>Essa página contém informações sobre o código desse website.</p>
<p>Total lines of code: {filteredLines.length}</p>

<div class="container">
    <div class="slider-container">
        <div class="slider">
            <label for="slider">Show commits until:</label>
            <input type="range" id="slider" name="slider" min=0 max=100 bind:value={commitProgress}/>
        </div>
        <time class="time-label">{commitMaxTime.toLocaleString()}</time>
    </div>
    <section>
        <h2>Summary</h2>
        <dl class="stats">
            <dt>Total <abbr title="Lines of code">LOC</abbr></dt>
            <dd>{filteredLines.length}</dd>
            <dt>Files</dt>
            <dd>{d3.groups(filteredLines, d => d.file).length}</dd>
            <dt>Commits</dt>
            <dd>{d3.groups(filteredLines, d => d.commit).length}</dd>
        </dl>
    </section>

    <!-- Gráfico SVG -->
    <svg viewBox="0 0 {width} {height}">
        <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
        <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
        <g class="gridlines" transform="translate({usableArea.left}, 0)" bind:this={yAxisGridlines} />
        <g class="dots">
            {#each filteredCommits as commit, index }
                <circle
                    class:selected={ clickedCommits.includes(commit) }
                    on:click={ evt => dotInteraction(index, evt) }
                    on:mouseenter={evt => dotInteraction(index, evt)}
                    on:mouseleave={evt => dotInteraction(index, evt)}
                    cx={ xScale(commit.datetime) }
                    cy={ yScale(commit.hourFrac) }
                    r={ rScale(commit.totalLines) }
                    fill="steelblue"
                    fill-opacity="0.5"
                />
            {/each}
        </g>
    </svg>
</div>

<Bar data={languageBreakdown} width={width} />

<!-- Tooltip -->
<dl class="info tooltip" hidden={hoveredIndex === -1} style="top: {tooltipPosition.y}px; left: {tooltipPosition.x}px" bind:this={commitTooltip}>
    <dt id="tooltip">Commit:</dt>
    <dd id="tooltip"><a href="{ hoveredCommit.url }" target="_blank">{ hoveredCommit.id }</a></dd>

    <dt id="tooltip">Date:</dt>
    <dd id="tooltip">{ hoveredCommit.datetime?.toLocaleString("en", {dateStyle: "full"}) }</dd>

    <dt id="tooltip">Author:</dt>
    <dd id="tooltip">{ hoveredCommit.author }</dd>

    <dt id="tooltip">Time:</dt>
    <dd id="tooltip">{ hoveredCommit.time }</dd>
</dl>

<style>
    /* Estilos gerais e grid para exibição dos dados */
    dl {
        display: grid;
        grid-template-columns: auto;
    }
    dt {
        grid-column: 1;
        font-family: inherit;
        font-weight: bold;
        color: var(--border-gray);
        text-transform: uppercase;
    }
    dd {
        grid-column: 2;
        font-family: inherit;
        font-weight: bold;
    }
    section {
        border-width: 0.15em;
        border-style: solid;
        border-color: var(--border-gray);
        padding-left: 1em;
        padding-right: 1em;
    }
    svg {
        overflow: visible;
    }
    .gridlines {
        stroke-opacity: .2;
    }

    .info {
        /* display: flex;
        flex-direction: column; */
        display: grid;
        grid-template-columns: 2;
        column-gap: 15px;
        margin: 0px;
        background-color: oklch(100% 0% 0 / 80%);
        box-shadow: 1px 1px 3px 3px gray;
        border-radius: 5px;
        backdrop-filter: blur(10px);
        padding: 10px;
        transition-duration: 250ms;
        transition-property: opacity, visibility;
        &[hidden]:not(:hover, :focus-within) {
            opacity: 0;
            visibility: hidden;
        }
    }

    /* Estilos de tooltip */
    .tooltip {
        color: black;
        position: fixed;
        top: 1em;
        left: 1em;
    }

    circle {
        transition: 200ms;
        transform-origin: center;
        transform-box: fill-box;
        &:hover {
            transform: scale(1.5);
        }
    }

    .selected {
        fill: var(--color-accent);
    }

    .slider-container{
	display:grid;
    }
    .slider{
        display: flex;
    }
    #slider{
        flex:1;
    }
    .time-label{
        font-size: 0.75em;
        text-align: right;
    }
</style>
