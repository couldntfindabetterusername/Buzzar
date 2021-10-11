<script>
  import Saymyname from "./Saymyname.svelte";
  import Timer from "./Timer.svelte";
  import Image from "./Image.svelte";

  let result;
  console.log(Timer);
  const timerEnds = (e) => {
    if (e.detail == "true") {
      result = `you're goddamn right`;
    } else {
      result = "you fucking idiot";
    }
  };
</script>

<div>
  <Saymyname />
  <Timer on:end={timerEnds} />

  <Image />
</div>

<div class="modal" style="display:{result ? 'flex' : 'none'}">
  <main><span>{result}</span></main>
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: auto;
    border: 2px solid rgba(0, 0, 0, 0.326);
    padding: 50px;
    width: 40%;
  }

  .modal {
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
    border: unset;
    background: rgba(0, 0, 0, 0.644);
  }
  main {
    width: 300px;
    height: 300px;
    background: white;
    color: black;
    font-size: 30px;
    text-transform: uppercase;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 30px;
  }
  @media screen and (max-width: 1000px) {
    div {
      width: 400px;
    }
  }

  @media screen and (max-width: 550px) {
    div {
      width: 90%;
      padding: 10px;
    }
  }
</style>
