class PlantUMLParser {
    constructor(shapes) {
        this.shapes = shapes;
        this.componentCounter = 0;
        this.uml = '@startuml\n';
    }

    parseSentence(sentence) {
        sentence = sentence.replace(/\bAND\b/gi, 'AND')
            .replace(/\bOR\b/gi, 'OR')
            .replace(/\bNOT\b/gi, 'NOT');

        const components = [];
        let currentComponent = '';
        let i = 0;

        while (i < sentence.length) {
            if (sentence[i] === ' ') {
                if (currentComponent) {
                    components.push(currentComponent.replace(/:/g, '').trim());
                    currentComponent = '';
                }
                i++;
            } else if (sentence.slice(i, i + 3) === 'AND' || sentence.slice(i, i + 2) === 'OR') {
                if (currentComponent) components.push(currentComponent.replace(/:/g, '').trim());
                currentComponent = '';
                components.push(sentence.slice(i, i + 3) === 'AND' ? 'AND' : 'OR');
                i += sentence.slice(i, i + 3) === 'AND' ? 3 : 2;
            } else if (sentence.slice(i, i + 3) === 'NOT') {
                if (currentComponent) components.push(currentComponent.replace(/:/g, '').trim());
                currentComponent = '';
                components.push('NOT');
                i += 3;
            } else {
                currentComponent += sentence[i];
                i++;
            }
        }
        if (currentComponent) components.push(currentComponent.replace(/:/g, '').trim());

        return components;
    }

    generatePlantUML(components) {
        const stack = [];
        const operatorStack = [];
        let mainEntity = components.shift(); // The main entity (e.g., Usuario)
        
        const precedence = {
            'OR': 1,
            'AND': 2,
            'NOT': 3
        };

        components.forEach(component => {
            if (component === 'AND' || component === 'OR' || component === 'NOT') {
                while (operatorStack.length > 0 && precedence[operatorStack[operatorStack.length - 1]] >= precedence[component]) {
                    stack.push(operatorStack.pop());
                }
                operatorStack.push(component);
            } else {
                stack.push(component);
            }
        });

        while (operatorStack.length > 0) {
            stack.push(operatorStack.pop());
        }

        const finalStack = [];
        stack.forEach(component => {
            if (component === 'AND' || component === 'OR' || component === 'NOT') {
                const compName = `${component}_${this.componentCounter++}`;
                this.uml += `component [${component}] as ${compName}\n`;

                if (component === 'NOT') {
                    const operand = finalStack.pop();
                    this.uml += `${compName} --> ${operand}\n`;
                    finalStack.push(compName);
                } else {
                    const rightOperand = finalStack.pop();
                    const leftOperand = finalStack.pop();
                    this.uml += `${compName} --> ${leftOperand}\n`;
                    this.uml += `${compName} --> ${rightOperand}\n`;
                    finalStack.push(compName);
                }
            } else {
                finalStack.push(component);
            }
        });

        const finalComponent = finalStack.pop();
        this.uml += `${mainEntity} --> ${finalComponent}\n`;
    }

    parse() {
        this.shapes.forEach(shape => {
            const components = this.parseSentence(shape);
            this.generatePlantUML(components);
        });
        this.uml += '@enduml';
        return this.uml;
    }
}

// Exportar la clase
module.exports = PlantUMLParser;
