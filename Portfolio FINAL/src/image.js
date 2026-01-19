(function () {
  // Simple, dependency-free image lightbox for images with class "myImg"
  var modal = document.getElementById("myModal");
  if (!modal) return;

  var modalImg = document.getElementById("img01");
  var captionText = document.getElementById("caption");
  var closeBtn = modal.querySelector(".close");
  var images = document.querySelectorAll(".myImg");

  function openModal(imgEl) {
    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
    modalImg.src = imgEl.src;
    modalImg.alt = imgEl.alt || "Expanded image";
    captionText.textContent = imgEl.alt || "";
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    captionText.textContent = "";
    document.body.style.overflow = "";
  }

  images.forEach(function (img) {
    img.addEventListener("click", function () {
      openModal(img);
    });
    img.setAttribute("tabindex", "0");
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(img);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  // Click outside image to close
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
})();
