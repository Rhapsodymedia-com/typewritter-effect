var txtTypes = [];

(function () {
	"use strict";

	const scriptTag = document.getElementById("type-writer");
	const speedBetweenLetter = scriptTag?.getAttribute("speed-between-letter");
	const beforeErasePause = scriptTag?.getAttribute("pause-time-before-erase-word");
	const beforeNewWordPause = scriptTag?.getAttribute("pause-time-before-new-word");
	const cursorColor = scriptTag?.getAttribute("cursor-color");
	const cursorBlinking = scriptTag?.getAttribute("cursor-blinking") || "yes";
	const cursorBlinkingSpeed = scriptTag?.getAttribute("cursor-blinking-speed");

	require.config({
		paths: {
			CerosSDK: "//sdk.ceros.com/standalone-player-sdk-v5.min"
		}
	});

	require(["CerosSDK"], function (CerosSDK) {
		CerosSDK.findExperience()
			.fail(function (error) {
				console.error(error);
			})
			.done(function (experience) {
				window.myExperience = experience;

				const animation = experience.findComponentsByTag("type-writer");

				experience.on(CerosSDK.EVENTS.PAGE_CHANGED, pageChangedCallbackText);

				function pageChangedCallbackText() {
					animation.components.forEach(function (component) {
						$("#" + component.id).addClass("type-write");
					});

					setTimeout(function () {
						const elements = document.getElementsByClassName("type-write");

						for (let i = 0; i < elements.length; i++) {
							const element = elements[i];
							const id = element.id;
							const component = myExperience.findComponentById(id);
							const tags = component.getTags();
							const erase = tags.indexOf("erase") !== -1 ? "true" : "false";
							const wordRotate = component.payload;
							const period = beforeErasePause || 2000;

							if (wordRotate && !$(element).hasClass("added-effect")) {
								const newest = new TxtType(
									element,
									JSON.parse(wordRotate),
									period,
									erase
								);

								txtTypes.push(newest);
								element.classList.add("added-effect");
							}
						}
					}, 1000);

					for (const txt of txtTypes) {
						clearTimeout(txt.cancelTimeout);
						txt.txt = "";
						txt.tick();
					}

					class TxtType {
						constructor(el, wordRotate, period, erase) {
							this.wordRotate = wordRotate;
							this.el = el;
							this.id = el.id;
							this.component = myExperience.findComponentById(this.id);
							this.loopNum = 0;
							this.period = parseInt(period, 10) || 2000;
							this.erase = erase;
							this.txt = "";
							this.isDeleting = false;
							this.cursor = true;
							this.cancelTimeout = null;

							this.sourceTextNode = this.findSourceTextNode();
							this.createTextNodes();
							this.tick();
						}

						findSourceTextNode() {
							const candidates = this.el.querySelectorAll("*");

							for (let i = 0; i < candidates.length; i++) {
								const node = candidates[i];
								const text = node.textContent?.trim();

								if (text) {
									return node;
								}
							}

							return this.el;
						}

						createTextNodes() {
							this.el.innerHTML = "";

							this.textNode = document.createElement("span");
							this.textNode.className = "typewriter-text";

							this.cursorNode = document.createElement("span");
							this.cursorNode.className = "typewriter-cursor";
							this.cursorNode.innerHTML = "&nbsp;";

							this.copyTextStyles(this.sourceTextNode, this.textNode);

							this.cursorNode.style.display = "inline-block";
							this.cursorNode.style.width = "0";
							this.cursorNode.style.marginLeft = "0";
							this.cursorNode.style.verticalAlign = "baseline";
							this.cursorNode.style.borderRight =
								"0.08em solid " +
								(cursorColor || getComputedStyle(this.textNode).color);

							this.el.appendChild(this.textNode);
							this.el.appendChild(this.cursorNode);
						}

						copyTextStyles(fromNode, toNode) {
							const styles = window.getComputedStyle(fromNode);

							const properties = [
								"font",
								"font-family",
								"font-size",
								"font-weight",
								"font-style",
								"line-height",
								"letter-spacing",
								"text-transform",
								"text-decoration",
								"text-rendering",
								"text-align",
								"color",
								"white-space",
								"word-spacing",
								"word-break",
								"overflow-wrap",
								"font-kerning",
								"font-feature-settings",
								"font-variation-settings",
								"-webkit-font-smoothing",
								"-moz-osx-font-smoothing"
							];

							properties.forEach(function (property) {
								toNode.style.setProperty(
									property,
									styles.getPropertyValue(property)
								);
							});

							toNode.style.background = "transparent";
							toNode.style.border = "none";
							toNode.style.margin = "0";
							toNode.style.padding = "0";
						}

						tick() {
							const i = this.loopNum % this.wordRotate.length;
							const fullTxt = this.wordRotate[i];

							if (this.isDeleting) {
								this.txt = fullTxt.substring(0, this.txt.length - 1);
							} else {
								this.txt = fullTxt.substring(0, this.txt.length + 1);
							}

							this.textNode.textContent = this.txt;

							const color = cursorColor || getComputedStyle(this.textNode).color;
							this.cursorNode.style.borderRightColor = color;

							let delta;

							if (!isEmpty(speedBetweenLetter)) {
								delta = Number(speedBetweenLetter) - Math.random() * 100;
							} else {
								delta = 200 - Math.random() * 100;
							}

							if (this.isDeleting) {
								delta /= 2;
							}

							if (!this.isDeleting && this.txt === fullTxt) {
								if (this.erase === "true") {
									delta = this.period;
									this.isDeleting = true;
								} else {
									if (cursorBlinking === "true") {
										this.cursorNode.style.borderRightColor = this.cursor
											? "transparent"
											: color;
										this.cursor = !this.cursor;
										delta = cursorBlinkingSpeed || 400;
									} else {
										this.cursorNode.style.borderRight = "none";
									}
								}
							} else if (this.isDeleting && this.txt === "") {
								this.isDeleting = false;
								this.loopNum++;
								delta = beforeNewWordPause || 500;
							}

							this.cancelTimeout = setTimeout(() => {
								this.tick();
							}, delta);
						}
					}

					function isEmpty(str) {
						return !str || str.length === 0;
					}
				}
			});
	});
})();
