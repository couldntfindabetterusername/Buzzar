<script>
  import Saymyname from "./Saymyname.svelte";
  import Timer from "./Timer.svelte";
  import Image from "./Image.svelte";

  console.log(Timer);
  const timerEnds = (e) => {};
</script>

<div>
  <Saymyname />
  <Timer on:end={timerEnds} />

  <Image />
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
