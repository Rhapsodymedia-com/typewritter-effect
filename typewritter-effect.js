var txtTypes = []
;(function () {
	"use strict"
	const scriptTag = document.getElementById("type-writer")
	const speedBetweenLetter = scriptTag?.getAttribute("speed-between-letter")
	const beforeErasePause = scriptTag?.getAttribute(
		"pause-time-before-erase-word"
	)
	const beforeNewWordPause = scriptTag?.getAttribute(
		"pause-time-before-new-word"
	)
	const cursorColor = scriptTag?.getAttribute("cursor-color")
	const cursorBlinking = scriptTag?.getAttribute("cursor-blinking") || "yes"
	const cursorBlinkingSpeed = scriptTag?.getAttribute("cursor-blinking-speed")
	require.config({
		paths: {
			CerosSDK: "//sdk.ceros.com/standalone-player-sdk-v5.min"
		}
	})
	require(["CerosSDK"], function (CerosSDK) {
		CerosSDK.findExperience()
			.fail(function (error) {
				console.error(error)
			})
			.done(function (experience) {
				window.myExperience = experience
				const animation = experience.findComponentsByTag("type-writer")
				experience.on(
					CerosSDK.EVENTS.PAGE_CHANGED,
					pageChangedCallbackText
				)
				function pageChangedCallbackText() {
					animation.components.forEach(function (component) {
						$("#" + component.id).addClass("type-write")
					})
					setTimeout(function () {
						const elements =
							document.getElementsByClassName("type-write")
						for (let i = 0; i < elements.length; i++) {
							const element = elements[i]
							const id = element.id
							const component = myExperience.findComponentById(id)
							const tags = component.getTags()
							const erase =
								tags.indexOf("erase") !== -1 ? "true" : "false"
							const wordRotate = component.payload
							const period = beforeErasePause || 2000
							if (
								wordRotate &&
								!$(element).hasClass("added-effect")
							) {
								const newest = new TxtType(
									element,
									JSON.parse(wordRotate),
									period,
									erase
								)
								txtTypes.push(newest)
								element.classList.add("added-effect")
							}
						}
					}, 1000)
					for (const txt of txtTypes) {
						clearTimeout(txt.cancelTimeout)
						txt.txt = ""
						txt.tick()
					}
					class TxtType {
						constructor(el, wordRotate, period, erase) {
							this.wordRotate = wordRotate
							this.el = el
							this.id = el.id
							this.component = myExperience.findComponentById(
								this.id
							)
							this.loopNum = 0
							this.period = parseInt(period, 10) || 2000
							this.erase = erase
							this.txt = ""
							this.isDeleting = false
							this.cursor = true
							this.cancelTimeout = null
							this.textNode = this.findTextNode(this.el)
							this.originalText = this.textNode
								? this.textNode.nodeValue
								: ""
							this.cursorNode =
								this.el.querySelector(".typewriter-cursor")
							if (!this.cursorNode) {
								this.cursorNode = document.createElement("span")
								this.cursorNode.className = "typewriter-cursor"
								this.cursorNode.setAttribute(
									"aria-hidden",
									"true"
								)
								this.cursorNode.style.display = "inline-block"
								this.cursorNode.style.width = "0"
								this.cursorNode.style.marginLeft = "0"
								this.cursorNode.style.verticalAlign = "baseline"
								this.cursorNode.style.borderRight =
									"0.08em solid " +
									(cursorColor ||
										getComputedStyle(this.el).color)
								this.el.appendChild(this.cursorNode)
							}
							this.tick()
						}
						findTextNode(root) {
							const walker = document.createTreeWalker(
								root,
								NodeFilter.SHOW_TEXT,
								{
									acceptNode(node) {
										if (
											!node.nodeValue ||
											!node.nodeValue.trim()
										) {
											return NodeFilter.FILTER_SKIP
										}
										if (
											node.parentNode &&
											node.parentNode.classList &&
											node.parentNode.classList.contains(
												"typewriter-cursor"
											)
										) {
											return NodeFilter.FILTER_SKIP
										}
										return NodeFilter.FILTER_ACCEPT
									}
								}
							)
							return walker.nextNode()
						}
						setDisplayedText(value) {
							if (this.textNode) {
								this.textNode.nodeValue = value
							}
						}
						tick() {
							const i = this.loopNum % this.wordRotate.length
							const fullTxt = this.wordRotate[i]
							if (this.isDeleting) {
								this.txt = fullTxt.substring(
									0,
									this.txt.length - 1
								)
							} else {
								this.txt = fullTxt.substring(
									0,
									this.txt.length + 1
								)
							}
							this.setDisplayedText(this.txt)
							const color =
								cursorColor || getComputedStyle(this.el).color
							this.cursorNode.style.borderRightColor = color
							let delta
							if (!isEmpty(speedBetweenLetter)) {
								delta =
									Number(speedBetweenLetter) -
									Math.random() * 100
							} else {
								delta = 200 - Math.random() * 100
							}
							if (this.isDeleting) {
								delta /= 2
							}
							if (!this.isDeleting && this.txt === fullTxt) {
								if (this.erase === "true") {
									delta = this.period
									this.isDeleting = true
								} else {
									if (cursorBlinking === "true") {
										this.cursorNode.style.borderRightColor =
											this.cursor ? "transparent" : color
										this.cursor = !this.cursor
										delta = cursorBlinkingSpeed || 400
									} else {
										this.cursorNode.style.borderRight =
											"none"
									}
								}
							} else if (this.isDeleting && this.txt === "") {
								this.isDeleting = false
								this.loopNum++
								delta = beforeNewWordPause || 500
							}
							this.cancelTimeout = setTimeout(() => {
								this.tick()
							}, delta)
						}
					}
					function isEmpty(str) {
						return !str || str.length === 0
					}
				}
			})
	})
})()
