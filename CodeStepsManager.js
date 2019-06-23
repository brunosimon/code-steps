import CodeStep from './CodeSteps.js'

export default class CodeStepManager
{
    constructor()
    {
        this.all = []

        this.parse()
    }

    parse(_$element = null)
    {
        const $element = !_$element ? document.body : _$element
        const $codeSteps = $element.querySelectorAll('.code-steps')

        for(const $codeStep of $codeSteps)
        {
            const options = {}

            options.$element = $codeStep
            options.text = $codeStep.innerText

            if(typeof $codeStep.dataset.type !== 'undefined')
            {
                options.type = $codeStep.dataset.type
            }

            if(typeof $codeStep.dataset.trim !== 'undefined')
            {
                options.trim = true
            }

            const codeStep = new CodeStep(options)

            this.all.push(codeStep)
        }
    }
}
