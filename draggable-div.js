// Adapted from: https://www.w3schools.com/howto/howto_js_draggable.asp

let draggables = document.getElementsByClassName("draggable")
for (let draggable of draggables) {
	console.log("Drag " + draggable)
	dragElement(draggable)
}

function dragElement(element) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	var child = element.children[0]
	var handle = child && child.classList.contains("draggable_header") ? child : element
	handle.addEventListener("mousedown", dragMouseDown);

	function dragMouseDown(e) {
		e = e || window.event;
		// e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.addEventListener("mouseup", closeDragElement);
		// call a function whenever the cursor moves:
		document.addEventListener("mousemove", elementDrag);
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		element.style.top = (element.offsetTop - pos2) + "px";
		element.style.left = (element.offsetLeft - pos1) + "px";
	}

	function closeDragElement() {
		// stop moving when mouse button is released:
		document.removeEventListener("mouseup", closeDragElement);
		document.removeEventListener("mousemove", elementDrag);
	}
}