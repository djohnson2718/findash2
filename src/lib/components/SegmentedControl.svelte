<script lang="ts" generics="T extends { name: string }">
    let {
        options,
        selectedOption = $bindable(),
    }: {
        options: T[];
        selectedOption?: T;
    } = $props();

    // Generate a unique identifier for this control instance's radio group
    const groupName = "seg_" + Math.random().toString(36).substring(2, 9);

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
        {@const inputId = `${groupName}_${option.name}`}
        <input
            type="radio"
            name={groupName}
            id={inputId}
            checked={selectedOption?.name === option.name}
            onclick={() => handleClick(option)}
        />
        <label for={inputId}>{option.name}</label>
    {/each}
</div>
