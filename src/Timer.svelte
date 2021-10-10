<script>
  import Progressbar from "./Progressbar.svelte";
</script>

<h3>time left:</h3>
<Progressbar />
<input type="text" />

<style>
  h3 {
    text-transform: capitalize;
  }
  input {
    outline: none;
    background-color: cornsilk;
    padding: 20px 25px;
    border: unset;
    width: 80%;
    font-size: 20px;
  }
</style>
