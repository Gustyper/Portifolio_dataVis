<script>
    import * as d3 from "d3";
    import StackedBar from '$lib/StackedBar.svelte';
    import FileLines from '$lib/FileLines.svelte';
    import Scrolly from "svelte-scrolly";

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    import {
        computePosition,
        autoPlacement,
        offset,
    } from '@floating-ui/dom';

    import { onMount, onDestroy } from "svelte";

    let data = [];
    let commits = [];
    let width = 800, height = 600;
    let margin = {top: 10, right: 20, bottom: 30, left: 40};

    let usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom
    };

    onMount(async () => {
        // Carrega dados
        data = await d3.csv("./loc.csv", row => ({
            ...row,
            line: Number(row.line),
            depth: Number(row.depth),
            length: Number(row.length),
            date: new Date(row.date + "T00:00" + row.timezone),
            datetime: new Date(row.datetime)
        }));
        
        // Processa commits
        commits = d3.groups(data, d => d.commit).map(([commit, lines]) => {
            let first = lines[0];
            let {author, date, time, timezone, datetime} = first;
            let ret = {
                id: commit,
                url: "https://github.com/Gustyper/Portifolio_dataVis/commit/" + commit,
                author, date, time, timezone, datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length
            };
            
            Object.defineProperty(ret, "lines", {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: false,
            });

            return ret;
        });

        commits = d3.sort(commits, d => -d.totalLines);

        // Configura redimensionamento responsivo
        const handleResize = () => {
            width = Math.min(window.innerWidth * 0.9, 1200);
            height = width * 0.6;
            
            usableArea = {
                top: margin.top,
                right: width - margin.right,
                bottom: height - margin.bottom,
                left: margin.left,
                width: width - margin.left - margin.right,
                height: height - margin.top - margin.bottom
            };
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        document.body.classList.add('meta-page');

        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.classList.remove('meta-page');
        };
    });

    // Computed properties
    $: minDate = d3.min(commits.map(d => d.date));
    $: maxDate = d3.max(commits.map(d => d.date));
    $: maxDatePlusOne = new Date(maxDate);
    $: maxDatePlusOne.setDate(maxDatePlusOne.getDate() + 1);

    let commitProgress = 100;
    $: timeScale = d3.scaleTime().domain([minDate,maxDate]).range([0,100]);
    $: commitMaxTime = timeScale.invert(commitProgress);

    $: filteredCommits = commits
        .filter(commit => commit.datetime <= commitMaxTime)
        .sort((a, b) => a.datetime - b.datetime);

    $: filteredMinDate = d3.min(filteredCommits.map(d => d.date));
    $: filteredMaxDate = d3.max(filteredCommits.map(d => d.date));
    $: filteredMaxDatePlusOne = new Date(filteredMaxDate);
    $: filteredMaxDatePlusOne.setDate(filteredMaxDatePlusOne.getDate() + 1);

    $: xScale = d3.scaleTime()
                .domain([filteredMinDate, filteredMaxDatePlusOne])
                .range([usableArea.left, usableArea.right])
                .nice();

    $: yScale = d3.scaleLinear()
                .domain([24, 0])
                .range([usableArea.top, usableArea.bottom]);

    let xAxis, yAxis;
    let yAxisGridlines;
    
    $: {
        d3.select(xAxis).call(d3.axisBottom(xScale));
        d3.select(yAxis).call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, "0") + ":00"));
        d3.select(yAxisGridlines).call(
            d3.axisLeft(yScale)
              .tickFormat("")
              .tickSize(-usableArea.width)
        );
    }

    let hoveredIndex = -1;
    $: hoveredCommit = filteredCommits[hoveredIndex] ?? hoveredCommit ?? {};

    let commitTooltip;
    let tooltipPosition = {x: 0, y: 0};
    let clickedCommits = [];

    async function dotInteraction(index, evt) {
        let hoveredDot = evt.target;
        if (evt.type === "mouseenter") {
            hoveredIndex = index;
            tooltipPosition = await computePosition(hoveredDot, commitTooltip, {
                strategy: "fixed",
                middleware: [
                    offset(10),
                    autoPlacement({
                        padding: 10,
                        boundary: document.querySelector('.container')
                    })
                ],
            });
        }
        else if (evt.type === "mouseleave") {
            hoveredIndex = -1
        }
        else if (evt.type === "click") {
            let commit = filteredCommits[index]
            if (!clickedCommits.includes(commit)) {
                clickedCommits = [...clickedCommits, commit];
            }
            else {
                clickedCommits = clickedCommits.filter(c => c !== commit);
            }
        }
    }

    $: rScale = d3.scaleSqrt()
                .domain(d3.extent(commits.map(d=>d.totalLines)))
                .range([2, 30]);
    
    $: filteredLines = data.filter(d => d.datetime <= commitMaxTime)
    
    $: allTypes = Array.from(new Set(filteredLines.map(d => d.type)));
    $: selectedLines = (filteredCommits.length > 0 ? filteredCommits : commits).flatMap(d => d.lines);

    $: selectedCounts = d3.rollup(
        selectedLines,
        v => v.length,
        d => d.type
    );

    $: languageBreakdown = allTypes.map(type => [type, selectedCounts.get(type) || 0]);
    $: dataObject = Object.fromEntries(languageBreakdown);
    $: keys = Object.keys(dataObject);
    $: dataForStack = [dataObject];
    $: stackedData = d3.stack().keys(keys)(dataForStack);
    $: total = d3.max(stackedData, series => d3.max(series, d => d[1])) || 1;

    $: xScaleStack = d3.scaleLinear()
                    .domain([0, total])
                    .range([0, usableArea.width]);

    $: numCommits = filteredCommits.length || 1;
    $: step = 100 / numCommits;
    $: currentCommitIndex = Math.min(Math.floor(commitProgress / step), numCommits - 1);
</script>

<svelte:head>
  <title>Meta</title>
</svelte:head>

<div class="container">
    <h1>Meta</h1>
    <p>Total lines of code: {data.length}</p>

    <Scrolly bind:progress={commitProgress} style="width: 90%; max-width: 800px; margin: auto;">
        {#if filteredCommits.length === 0}
          <p>Loading commits...</p>
        {:else}
          {#each filteredCommits as commit, index (commit.id)}
            <p class="narrative" style="opacity: {commitProgress >= index * step ? 1 : 0.2}; transition: opacity 0.3s;">
              On <strong>{commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}</strong>,  
              {index === 0
                ? `I made the first commit, starting the project. You can see it <a href="${commit.url}" target="_blank">here</a>.`
                : `I added another commit. Check it in this link: <a href="${commit.url}" target="_blank">here</a>. It was a very important commit to me and definitely helped me become a better programming genius, as I currently am. I praise the existence of this commit and all its reasoning, he is full of love.`}
              This commit changed <strong>{commit.totalLines}</strong> lines in <strong>{d3.groups(commit.lines, d => d.file).length}</strong> files.
            </p>
          {/each}
        {/if}
    
        <svelte:fragment slot="viz">
          <!-- Scatterplot com commits -->
          <svg width="100%" viewBox={`0 0 ${width} ${height}`} style="display: block; margin: 20px auto; max-width: 100%;">
            <g transform="translate(0, {usableArea.bottom})" bind:this={xAxis} />
            <g transform="translate({usableArea.left}, 0)" bind:this={yAxis} />
            <g class="gridlines" transform="translate({usableArea.left}, 0)" bind:this={yAxisGridlines} />
            <g class="dots">
              {#each filteredCommits as commit, index}
                <circle
                  on:mouseenter={evt => dotInteraction(index, evt)}
                  on:mouseleave={evt => dotInteraction(index, evt)}
                  on:click={evt => dotInteraction(index, evt)}
                  class:selected={clickedCommits.includes(commit)}
                  cx={xScale(commit.datetime)}
                  cy={yScale(commit.hourFrac)}
                  r={rScale(commit.totalLines)}
                  fill="steelblue"
                  fill-opacity="0.5"
                  style="cursor: pointer;"
                />
              {/each}
            </g>
          </svg>
      
          <!-- Stacked Bar mostrando tipos -->
          <StackedBar
            {stackedData}
            {keys}
            {width}
            barHeight={40}
            xScale={xScaleStack}
            colorScale={colorScale}
          />
        </svelte:fragment>
    </Scrolly>

    <FileLines lines={filteredLines} width={usableArea.width} colorScale={colorScale} />
</div>

<style>
    .container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
        box-sizing: border-box;
    }

    .narrative {
        font-size: 1rem;
        line-height: 1.5;
        margin-bottom: 1.5rem;
    }
    
    .narrative a {
        color: #007acc;
        text-decoration: none;
    }
    
    .narrative a:hover {
        text-decoration: underline;
    }
    
    .selected {
        stroke: black;
        stroke-width: 2px;
    }
    
    svg {
        width: 100%;
        height: auto;
        max-width: 100%;
        overflow: visible;
    }

    .gridlines {
        stroke-opacity: .2;
    }

    .info {
        display: grid;
        margin: 0;
        grid-template-columns: 2;
        background-color: oklch(100% 0% 0 / 80%);
        box-shadow: 1px 1px 3px 3px gray;
        border-radius: 5px;
        backdrop-filter: blur(10px);
        padding: 10px;
        transition-duration: 500ms;
        transition-property: opacity, visibility;
    }

    .info[hidden]:not(:hover, :focus-within) {
        opacity: 0;
        visibility: hidden;
    }

    .info dt {
        grid-column: 1;
        grid-row: auto;
    }

    .info dd {
        grid-column: 2;
        grid-row: auto;
        font-weight: 400;
    }

    .tooltip {
        position: fixed;
        top: 1em;
        left: 1em;
    }

    circle {
        transition: 200ms;
        transform-origin: center;
        transform-box: fill-box;
    }
    
    circle:hover {
        transform: scale(1.5);
    }
    
    @starting-style {
        r: 0;
    }

    :global(body.meta-page) {
        width: 90%;
        max-width: none;
        margin-inline: auto;
        padding: 1cm;
    }

    @media (max-width: 768px) {
        :global(body.meta-page) {
            width: 95%;
            padding: 0.5cm;
        }
        
        .narrative {
            font-size: 0.9rem;
        }
        
        .container {
            padding: 0 10px;
        }
    }
</style>