export default class CodeSteps
{
    constructor(_options = {})
    {
        // Set options
        this.setOptions(_options)

        // Set code
        this.setCode()

        // Set description
        this.setDescription()

        // Set steps
        this.setSteps()

        // Set sizes
        this.setSizes()

        // Set navigation
        this.setNavigation()

        // Go to first step
        this.go(0)

        // Save in Element
        this.$element.classList.add('code-steps-set')
        this.$element.codeSteps = this
    }

    setOptions(_options)
    {
        // Target (mandatory)
        this.$element = _options.$element

        if(!this.$element)
        {
            console.warn('CodeSteps: Missing $element', this)
        }

        // Type (mandatory)
        this.type = _options.type

        if(!this.type)
        {
            console.warn('CodeSteps: Missing type', this)
        }

        // Text (mandatory)
        this.text = _options.text

        if(!this.text)
        {
            console.warn('CodeSteps: Missing text', this)
        }

        // Prism
        this.Prism = typeof _options.Prism !== 'undefined' ? _options.Prism : window.Prism

        if(!this.Prism)
        {
            console.warn('CodeSteps: Missing Prism library', this)
        }

        // Trim (optional)
        this.trim = typeof _options.trim !== 'undefined' ? _options.trim : false

        // Active (optional)
        this.active = typeof _options.active !== 'undefined' ? _options.active : true
    }

    setCode()
    {
        this.code = {}

        this.code.$pre = this.$element.querySelector('pre')
        this.code.$code = this.$element.querySelector('code')

        // Text
        this.code.text = this.text
        this.code.text = this.code.text.replace(/\t/g, '    ')

        if(this.trim)
        {
            this.code.text = this.code.text.trim()
        }

        // HTML base from Prism
        this.code.baseHtml = this.Prism.highlight(this.code.text, this.Prism.languages[this.type], this.type)

        // Base fragment
        const $baseFragment = document.createElement('div')
        $baseFragment.innerHTML = this.code.baseHtml

        // New fragment
        const $newFragment = document.createDocumentFragment()

        // Seperate each letter of each token and save into lines
        this.code.lines = []
        let line = []
        let latestLetter = null
        for(const _$child of $baseFragment.childNodes)
        {
            for(const _letter of _$child.textContent)
            {
                // Create letter with same classes
                const $letter = document.createElement('span')
                $letter.innerHTML = _letter
                $letter.classList.add('cs-letter')

                if(_$child.nodeType !== Node.TEXT_NODE)
                {
                    $letter.classList.add(..._$child.classList)
                }

                // Add to new fragment
                $newFragment.appendChild($letter)

                // Save in current line
                if(_letter !== '\n')
                {
                    line.push($letter)
                }

                // Save line to lines if line break
                else
                {
                    this.code.lines.push(line)
                    line = []
                }

                // Save latest letter
                latestLetter = _letter
            }
        }

        // If latest letter saved wasn't a line break, save line
        if(latestLetter !== '\n')
        {
            this.code.lines.push(line)
        }

        // Set DOM and classes
        this.code.$code.innerHTML = ''
        this.code.$code.appendChild($newFragment)
        this.code.$code.classList.add(`language-${this.type}`)

        this.code.$pre.classList.add(`language-${this.type}`)
    }

    setSteps()
    {
        this.steps = {}

        this.steps.stepsPattern = /\s*;\s*/
        this.steps.stepPattern = /\s*:\s*/
        this.steps.rangesPattern = /\s*,\s*/
        this.steps.rangePattern = /\s*-\s*/

        this.steps.base = typeof this.steps.base !== 'undefined' ? this.$element.dataset.steps : ''

        if(this.steps.base.trim() === '')
        {
            this.steps.base = '*:'
        }

        this.steps.all = this.parseSteps(this.steps.base)
    }

    setDescription()
    {
        this.description = {}
        this.description.all = []

        // Container
        this.description.$container = document.createElement('div')
        this.description.$container.classList.add('cs-descriptions')

        // Add to DOM
        this.$element.appendChild(this.description.$container)
    }

    parseSteps(_input = '')
    {
        const steps = []

        // Seperate steps
        const stepsParts = _input.replace(/^\n\s+|\n\s+$/gm, '').split(this.steps.stepsPattern)

        for(const _stepPart of stepsParts)
        {
            const step = this.parseStep(_stepPart)

            if(step)
            {
                steps.push(step)
            }
        }

        return steps
    }

    parseStep(_input = '')
    {
        // Seperate step parts
        const stepParts = _input.split(this.steps.stepPattern)

        // Test if step is composed of two parts
        if(stepParts.length === 2)
        {
            const step = {}

            step.ranges = this.parseRanges(stepParts[0])
            step.text = stepParts[1]

            // Description
            step.description = step.text === '' ? false : {}

            if(step.description)
            {
                step.description.$element = document.createElement('div')
                step.description.$element.classList.add('cs-description')

                step.description.$inner = document.createElement('div')
                step.description.$inner.classList.add('cs-inner')
                step.description.$inner.textContent = step.text
                step.description.$element.appendChild(step.description.$inner)

                this.description.$container.appendChild(step.description.$element)
            }

            // Letters
            step.letters = []

            for(const _range of step.ranges)
            {
                for(const _lineIndex in this.code.lines)
                {
                    const lineIndex = parseInt(_lineIndex)
                    const line = this.code.lines[_lineIndex]

                    for(const _letterIndex in line)
                    {
                        const letterIndex = parseInt(_letterIndex)
                        const letter = line[_letterIndex]

                        if(
                            // Between lines
                            (
                                lineIndex > _range.start.line && lineIndex < _range.end.line
                            ) ||
                            // One line and between columns
                            (
                                _range.start.line === _range.end.line &&
                                (
                                    (lineIndex === _range.start.line && letterIndex >= _range.start.column) &&
                                    (lineIndex === _range.end.line && letterIndex <= _range.end.column)
                                )
                            ) ||
                            // One line and between columns
                            (
                                _range.start.line !== _range.end.line &&
                                (
                                    (lineIndex === _range.start.line && letterIndex >= _range.start.column) ||
                                    (lineIndex === _range.end.line && letterIndex <= _range.end.column)
                                )
                            )
                        )
                        {
                            step.letters.push(letter)
                        }
                    }
                }
            }

            return step
        }

        console.warn('CodeSteps: Step not properly formated', _input)

        return false
    }

    parseRanges(_input = '')
    {
        const ranges = []

        // Seperate ranges parts
        const rangesParts = _input.split(this.steps.rangesPattern)

        for(const _rangePart of rangesParts)
        {
            const range = this.parseRange(_rangePart)

            if(range)
            {
                ranges.push(range)
            }
        }

        return ranges
    }

    parseRange(_input = '')
    {
        // Set up
        const range = {}
        range.start = {}
        range.end = {}

        // Wildcard (all the code)
        if(_input === '*')
        {
            range.start.line = 0
            range.start.column = 0

            range.end.line = this.code.lines.length - 1
            range.end.column = this.code.lines[this.code.lines.length - 1].length - 1

            return range
        }

        // Not wildcard
        else
        {
            // Seperate range parts
            const rangeParts = _input.split(this.steps.rangePattern)

            if(rangeParts.length === 2)
            {
                range.start = this.parsePosition(rangeParts[0], false)
                range.end = this.parsePosition(rangeParts[1], true)

                if(range.start && range.end)
                {
                    return range
                }
            }
            else if(rangeParts.length === 1)
            {
                range.start = this.parsePosition(rangeParts[0], false)
                range.end = this.parsePosition(rangeParts[0], true)

                if(range.start && range.end)
                {
                    return range
                }
            }
        }

        console.warn('CodeSteps: Range not properly formated', _input)

        return false
    }

    parsePosition(_input = '', _include = false)
    {
        const positionMatch = _input.match(/^(?:l([0-9]+))(?:c([0-9]+))?$/)

        // Posittion has proper format
        if(positionMatch)
        {
            const position = {}

            // Line
            position.line = parseInt(positionMatch[1]) - 1
            position.line = Math.max(Math.min(position.line, this.code.lines.length - 1), 0) // Clamp

            // Column
            if(typeof positionMatch[2] !== 'undefined')
            {
                position.column = parseInt(positionMatch[2]) - 1
            }
            else
            {
                position.column = _include ? this.code.lines[position.line].length - 1 : 0
            }

            position.column = Math.max(Math.min(position.column, this.code.lines[position.line].length - 1), 0) // Clamp

            return position
        }

        console.warn('CodeSteps: Position not properly formated', _input)

        return false
    }

    setSizes()
    {
        this.sizes = {}
        this.sizes.throttleDuration = 100
        this.sizes.throttleTimeout = null

        this.sizes.width = null
        this.sizes.height = null
        this.sizes.maxDescriptionHeight = null

        this.sizes.update = () =>
        {
            // Inactive
            if(!this.active)
            {
                return
            }

            // Retrieve all sizes
            const containerBoundings = this.$element.getBoundingClientRect()

            this.sizes.width = containerBoundings.width
            this.sizes.height = containerBoundings.height
            this.sizes.descriptionsHeight = 0

            for(const _step of this.steps.all)
            {
                if(_step.description)
                {
                    const descriptionBoundings = _step.description.$inner.getBoundingClientRect()

                    if(descriptionBoundings.height > this.sizes.descriptionsHeight)
                    {
                        this.sizes.descriptionsHeight = descriptionBoundings.height
                    }
                }
            }

            // Update DOM
            this.$element.style.setProperty('--descriptions-height', `${this.sizes.descriptionsHeight}px`)
        }

        window.addEventListener('resize', () =>
        {
            window.clearTimeout(this.sizes.throttleTimeout)

            this.sizes.throttleTimeout = window.setTimeout(this.sizes.update, this.sizes.throttleDuration)
        })

        this.sizes.update()
    }

    setNavigation()
    {
        this.navigation = {}

        // Arrows
        this.navigation.arrows = {}
        this.navigation.arrows.$previous = document.createElement('div')
        this.navigation.arrows.$previous.classList.add('cs-arrow', 'cs-previous')
        this.navigation.arrows.$previous.textContent = '⮕'
        this.$element.appendChild(this.navigation.arrows.$previous)

        this.navigation.arrows.$previous.addEventListener('click', (_event) =>
        {
            // Inactive
            if(!this.active)
            {
                return
            }

            _event.preventDefault()

            this.previous()
        })

        this.navigation.arrows.$next = document.createElement('div')
        this.navigation.arrows.$next.classList.add('cs-arrow', 'cs-next')
        this.navigation.arrows.$next.textContent = '⮕'
        this.$element.appendChild(this.navigation.arrows.$next)

        this.navigation.arrows.$next.addEventListener('click', (_event) =>
        {
            // Inactive
            if(!this.active)
            {
                return
            }

            _event.preventDefault()

            this.next()
        })

        this.navigation.index = null

        window.addEventListener('keydown', (_event) =>
        {
            // Inactive
            if(!this.active)
            {
                return
            }

            // Right arrow key
            if(_event.key === 'ArrowRight')
            {
                this.next()
            }

            // Left arrow key
            else if(_event.key === 'ArrowLeft')
            {
                this.previous()
            }
        })
    }

    previous()
    {
        // Inactive
        if(!this.active)
        {
            return
        }

        // In limit
        if(this.navigation.index > 0)
        {
            this.go(this.navigation.index - 1)
        }
    }

    next()
    {
        // Inactive
        if(!this.active)
        {
            return
        }

        // In limit
        if(this.navigation.index < this.steps.all.length - 1)
        {
            this.go(this.navigation.index + 1)
        }
    }

    go(_index)
    {
        // Inactive
        if(!this.active)
        {
            return
        }

        // Old step
        if(this.navigation.index !== null)
        {
            const oldStep = this.steps.all[this.navigation.index]

            for(const _letter of oldStep.letters)
            {
                _letter.classList.remove('cs-is-active')
            }

            if(oldStep.description)
            {
                oldStep.description.$element.classList.remove('cs-is-active')
            }
        }

        // New step
        const newStep = this.steps.all[_index]

        for(const _letter of newStep.letters)
        {
            _letter.classList.add('cs-is-active')
        }

        if(newStep.description)
        {
            newStep.description.$element.classList.add('cs-is-active')
        }

        // Arrows
        if(_index === 0)
        {
            this.navigation.arrows.$previous.classList.remove('cs-is-active')
        }
        else
        {
            this.navigation.arrows.$previous.classList.add('cs-is-active')
        }

        if(_index === this.steps.all.length - 1)
        {
            this.navigation.arrows.$next.classList.remove('cs-is-active')
        }
        else
        {
            this.navigation.arrows.$next.classList.add('cs-is-active')
        }

        // Save
        this.navigation.index = _index
    }

    activate()
    {
        // Save
        this.active = true

        // Update sizes
        this.sizes.update()

        // Go to previous index to re-activate each element
        this.go(this.navigation.index)
    }

    deactivate()
    {
        // Save
        this.active = false

        // Deactivate descriptions
        for(const _step of this.steps.all)
        {
            if(_step.description)
            {
                _step.description.$element.classList.remove('cs-is-active')
            }
        }

        // Deactivate letters
        for(const _line of this.code.lines)
        {
            for(const _$letter of _line)
            {
                _$letter.classList.remove('cs-is-active')
            }
        }

        // Deactivate arrows
        this.navigation.arrows.$previous.classList.remove('cs-is-active')
        this.navigation.arrows.$next.classList.remove('cs-is-active')
    }
}
