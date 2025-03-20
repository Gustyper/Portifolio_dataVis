<svelte:head>
  <title>Contact me</title>
</svelte:head>

<div class="form-container">
    <form action="#" method="post">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>

        <label for="subject">Assunto:</label>
        <input type="text" id="subject" name="subject" required>

        <label for="message">Mensagem:</label>
        <textarea id="message" name="message" rows="4" required></textarea>

        <button type="submit">Enviar</button>
    </form>
</div>