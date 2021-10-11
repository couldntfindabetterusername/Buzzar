<script>
  import Progressbar from "./Progressbar.svelte";
  import { createEventDispatcher } from "svelte";

  let input;
  const dispatch = createEventDispatcher();
  const totalSec = 10;
  let secondsLeft = totalSec;

  $: prog = ((totalSec - secondsLeft) / totalSec) * 100;

  let timer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft == 0) {
      clearInterval(timer);
    }
  }, 1000);

  const eventHandler = (e) => {
    e.preventDefault();
    if (input.toUpperCase() == "HEISENBERG") {
      console.log("true");

      dispatch("end", "true");
    } else {
      console.log("f");
      dispatch("end", "false");
    }
    clearInterval(timer);
  };
</script>

<!--html-->
<h3>time left: {secondsLeft}</h3>
<Progressbar {prog} />
<form on:submit={(e) => eventHandler(e)}>
  <input type="text" bind:value={input} />
  <button type="submit">ENTER</button>
</form>

<style>
  h3 {
    text-transform: capitalize;
  }
  form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  input,
  button {
    outline: none;
    background-color: cornsilk;
    padding: 20px 25px;
    border: 1px solid rgba(158, 145, 94, 0.25);
    border-radius: 10px;
    width: 80%;
    font-size: 20px;
  }
  button {
    margin: 10px;
    background: rgb(134, 7, 7);
    color: white;
  }
</style>
