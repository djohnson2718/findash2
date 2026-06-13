<script lang="ts" generics="T extends { name: string }">
    let { 
        options, 
        selectedOption = $bindable() 
    }: { 
        options: T[]; 
        selectedOption?: T; 
    } = $props();

    // Set initial selection if not set by parent
    if (selectedOption === undefined && options.length > 0) {
        selectedOption = options[0];
    }

    function handleClick(option: T) {
        selectedOption = option;
    }
</script>

<div class="segmented-control">
    {#each options as option}
        <input
            type="radio"
            name="view"
            id={option.name}
            checked={selectedOption === option}
            onclick={() => handleClick(option)}
        />
        <label for={option.name}>{option.name}</label>
    {/each}
</div>
