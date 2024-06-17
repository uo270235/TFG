class PlantUMLParser {
    constructor(shapes, texto) {
        this.texto = texto;
        this.shapes = shapes;
        this.componentCounter = 0;
        this.existingClasses = [];
        this.uml = `@startuml
        allowmixing
        skinparam component {
        BackgroundColor<<AND>> #1E3A8A
        BorderColor<<AND>> #60A5FA
        FontColor<<AND>> #E0F2FE
        
        BackgroundColor<<NOT>> #F87171
        BorderColor<<NOT>> #B91C1C
        FontColor<<NOT>> #FFFFFF
        
        BackgroundColor<<OR>> #065F46
        BorderColor<<OR>> #6EE7B7
        FontColor<<OR>> #D1FAE5
        }
        
        skinparam {
        Shadowing true
        RoundCorner 15
        }
        `;
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

        const declaredComponents = new Set();

        // Declarar el mainEntity como un rectángulo si no está ya en existingClasses
        if (!this.existingClasses.includes(mainEntity)) {
            this.uml += `class ${mainEntity}{\n${this.extraerContenidoClase(mainEntity)}\n}\n`;
            this.existingClasses.push(mainEntity);
        }
        declaredComponents.add(mainEntity);

        // Declarar todos los componentes como rectángulos primero
        stack.forEach(component => {
            if (component !== 'AND' && component !== 'OR' && component !== 'NOT' && !declaredComponents.has(component)) {
                if (!this.existingClasses.includes(component)) {
                    this.uml += `class ${component}{\n${this.extraerContenidoClase(component)}\n}\n`;
                    this.existingClasses.push(component);
                }
                declaredComponents.add(component);
            }
        });

        const finalStack = [];
        stack.forEach(component => {
            if (component === 'AND' || component === 'OR' || component === 'NOT') {
                const compName = `${component}_${this.componentCounter++}`;
                this.uml += `component [ ] as ${compName} <<${component}>>\n`;

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

    extraerContenidoClase(nombreClase) {
        // Definir el patrón para encontrar la clase y su contenido, incluyendo el guion bajo opcional
        const patron = new RegExp(`class _?${nombreClase} \\{([^}]*)\\}`, 's');
        // Buscar todas las coincidencias en el texto
        const coincidencia = this.texto.match(patron);
        
        if (coincidencia) {
            // Si hay coincidencias, devolver la primera (el contenido dentro de la clase)
            return coincidencia[1].trim();
        } else {
            // Si no hay coincidencias, devolver una cadena vacía
            return '';
        }
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
