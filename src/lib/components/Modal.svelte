<script lang="ts">
  const { children, onSave } = $props();
  let dialog: HTMLDialogElement;

  function showModal() {
    dialog.showModal();
  }

  function save() {
    if (onSave) {
      onSave();
    }
    dialog.close();
  }

  // expose methods to parent
  export { showModal };
</script>

<dialog bind:this={dialog} class="modal">
  {@render children()}
  <button class="modern-button" onclick={() => dialog.close()}>Cancel</button>
  <button class="modern-button" onclick={save}>Save</button>
</dialog>

<style>
  dialog::backdrop {
    background: rgba(0,0,0,0.5);
  }
</style>

