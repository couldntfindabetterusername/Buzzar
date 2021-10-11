<script>
  export let prog = 30;
</script>

<div class="progress-container">
  <div class="progress" style="width:{prog}%">
    <span>{prog}%</span>
  </div>
</div>

<style>
  .progress-container {
    width: 80%;
    border: 1px solid rgba(0, 0, 0, 0.781);

    margin: 20px 0;
  }
  .progress {
    height: 30px;
    background: rgb(131, 255, 15);
  }

  span {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    left: 50%;
    position: absolute;
    line-height: 30px;
  }
</style>
