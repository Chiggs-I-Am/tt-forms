import type React from "react";

const MINIMUM_PRESS_MS = 225;

let rippleId = 0;

export function createRipple(
	button: HTMLElement,
	event: React.PointerEvent<HTMLElement>,
) {
	if (!button) {
		return;
	}

	const rect = button.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	const size = Math.max(rect.width, rect.height) * 2.5;

	const ripple = document.createElement("div");
	ripple.id = `ripple-${rippleId++}`;
	ripple.style.left = `${x - size / 2}px`;
	ripple.style.top = `${y - size / 2}px`;
	ripple.style.width = `${size}px`;
	ripple.style.height = `${size}px`;
	ripple.className =
		"absolute rounded-full bg-current opacity-20 origin-center animate-ripple-press";
	button.appendChild(ripple);

	const release = () => {
		ripple.classList.add("animate-ripple-release");
		ripple.addEventListener("animationend", (e) => {
			if (e.animationName === "ripple-release") {
				ripple.remove();
			}
		});
	};

	const pressStart = performance.now();

	const handlePointerUp = () => {
		const pressDuration = performance.now() - pressStart;
		if (pressDuration < MINIMUM_PRESS_MS) {
			setTimeout(release, MINIMUM_PRESS_MS - pressDuration);
		} else {
			release();
		}
		document.removeEventListener("pointerup", handlePointerUp);
	};

	document.addEventListener("pointerup", handlePointerUp);
}
