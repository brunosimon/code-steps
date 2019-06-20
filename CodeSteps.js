export default class CodeSteps
{
    constructor(_options = {})
    {
        // Set options
        this.setOptions(_options)

        // Set code
        this.setCode()

        // Set steps
        this.setSteps()

        // Set navigation
        this.setNavigation()

        // Go to first step
        this.go(0)
    }

    setOptions(_options)
    {
        // Target (mandatory)
        this.$target = _options.$target

        if(!this.$target)
        {
            console.warn('CodeStep: Missing $target', this)
        }

        // Type (mandatory)
        this.type = _options.type

        if(!this.type)
        {
            console.warn('CodeStep: Missing type', this)
        }

        // Text (mandatory)
        this.text = _options.text

        if(!this.text)
        {
            console.warn('CodeStep: Missing text', this)
        }

        // Trim (optional)
        this.trim = typeof _options.trim !== 'undefined' ? _options.trim : false
    }

    setCode()
    {
        this.code = {}

        this.code.text = this.trim ? this.text.trim() : this.trim
        this.code.baseHtml = Prism.highlight(this.code.text, Prism.languages[this.type], this.type)

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
                $letter.style.opacity = 0.35
                $letter.style.willChange = 'opacity'

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
        this.$target.innerHTML = ''
        this.$target.appendChild($newFragment)
        this.$target.classList.add(`language-${this.type}`)

        if(this.$target.parentElement.tagName === 'PRE')
        {
            this.$target.parentElement.classList.add(`language-${this.type}`)
        }
    }

    setSteps()
    {
        this.steps = {}

        this.steps.stepsPattern = /\s*;\s*/
        this.steps.stepPattern = /\s*:\s*/
        this.steps.rangesPattern = /\s*,\s*/
        this.steps.rangePattern = /\s*-\s*/

        this.steps.base = this.$target.dataset.steps
        this.steps.all = this.parseSteps(this.steps.base)
        console.log(this.steps.all)
    }

    parseSteps(_input = '')
    {
        const steps = []

        // Seperate steps
        const stepsParts = _input.split(this.steps.stepsPattern)

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
                            (lineIndex > _range.start.line && lineIndex < _range.end.line) ||
                            (
                                (lineIndex === _range.start.line && letterIndex >= _range.start.column) &&
                                (lineIndex === _range.end.line && letterIndex <= _range.end.column)
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

        console.warn('CodeStep: Step not properly formated', _input)

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

        console.warn('CodeStep: Range not properly formated', _input)

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

        console.warn('CodeStep: Position not properly formated', _input)

        return false
    }

    setNavigation()
    {
        this.navigation = {}
        this.navigation.index = null

        window.addEventListener('keydown', (_event) =>
        {
            if(_event.key === 'ArrowRight')
            {
                this.next()
            }
            else if(_event.key === 'ArrowLeft')
            {
                this.previous()
            }
        })
    }

    previous()
    {
        if(this.navigation.index > 0)
        {
            this.go(this.navigation.index - 1)
        }
    }

    next()
    {
        if(this.navigation.index < this.steps.all.length - 1)
        {
            this.go(this.navigation.index + 1)
        }
    }

    go(_index)
    {
        // Old step
        if(this.navigation.index !== null)
        {
            const oldStep = this.steps.all[this.navigation.index]

            for(const _letter of oldStep.letters)
            {
                _letter.style.opacity = 0.35
            }
        }

        // New step
        const newStep = this.steps.all[_index]

        for(const _letter of newStep.letters)
        {
            _letter.style.opacity = 1
        }

        this.navigation.index = _index
    }
}
