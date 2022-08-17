export default function handleDOMContentLoaded(): void {
    document.addEventListener("DOMContentLoaded", function () {
        console.log("DOMReady: True", new Date());
    });
}
