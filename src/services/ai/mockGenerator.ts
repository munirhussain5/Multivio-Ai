import { 
  AIModelResponse, 
  AIProvider, 
  FollowUpMessage, 
  PracticeQuestion, 
  QuizData, 
  QuizQuestion, 
  StudyNote, 
  SynthesisResult,
  UploadedDocument
} from '../../types';

interface TopicKnowledge {
  keywords: string[];
  topicTitle: string;
  chatgpt: {
    answer: string;
    perspective: string;
    approach: string;
  };
  gemini: {
    answer: string;
    perspective: string;
    approach: string;
  };
  claude: {
    answer: string;
    perspective: string;
    approach: string;
  };
  deepseek: {
    answer: string;
    perspective: string;
    approach: string;
  };
  synthesis: SynthesisResult;
  quizQuestions: QuizQuestion[];
  notes: StudyNote;
}

const KNOWLEDGE_BASE: TopicKnowledge[] = [
  {
    keywords: ['polymorphism', 'oop', 'object-oriented', 'inherit'],
    topicTitle: 'Polymorphism in Object-Oriented Programming',
    chatgpt: {
      perspective: 'Structural Class Hierarchy & Method Overriding',
      approach: 'Focuses on inheritance, method overriding vs overloading, and common animal/shape class hierarchies.',
      answer: `### Polymorphism in Object-Oriented Programming

Polymorphism is one of the four foundational pillars of Object-Oriented Programming (OOP), alongside Encapsulation, Inheritance, and Abstraction.

#### 1. What Does It Mean?
The term comes from Greek, meaning "having multiple forms." In programming, polymorphism allows objects belonging to different classes to be treated through a single, common interface.

#### 2. The Two Major Types
1. **Compile-Time Polymorphism (Static / Early Binding):**
   - Achieved through **Method Overloading** (same method name, different parameter signatures) and **Operator Overloading**.
   - Resolved by the compiler during code build.

2. **Runtime Polymorphism (Dynamic / Late Binding):**
   - Achieved through **Method Overriding** via inheritance and abstract classes/interfaces.
   - The exact method executed is determined at runtime based on the actual object instance.

#### 3. Standard Code Example (Java / TypeScript)
\`\`\`typescript
class Animal {
  makeSound(): void {
    console.log("Some generic sound");
  }
}

class Dog extends Animal {
  makeSound(): void {
    console.log("Woof! Woof!");
  }
}

class Cat extends Animal {
  makeSound(): void {
    console.log("Meow!");
  }
}

// Polymorphic invocation:
const pets: Animal[] = [new Dog(), new Cat()];
pets.forEach(pet => pet.makeSound());
// Outputs:
// "Woof! Woof!"
// "Meow!"
\`\`\`

#### Key Takeaway for Students
You write code that interacts with the base class \`Animal\`, yet the runtime automatically executes the specialized behavior of the child class. This decouples calling logic from concrete implementations.`
    },
    gemini: {
      perspective: 'Intuitive Analogies & Interface Contract Abstraction',
      approach: 'Uses the Universal Remote and USB-C port analogies to ground abstraction and explain dynamic dispatch without jargon overload.',
      answer: `### Understanding Polymorphism: The Universal Interface

Think of polymorphism like a **Universal Remote Control** or a **USB-C charging cable**.

Your laptop, phone, headphones, and tablet all have USB-C ports. You don't need four different special chargers engineered for every single gadget. The charger simply says: *"If you satisfy the USB-C contract, I will deliver power."* Each device absorbs that power differently according to its internal circuitry.

#### How It Works in Software
In software architecture, polymorphism means: **"One interface, multiple independent implementations."**

#### The Real-World Benefits
- **Extensibility:** If tomorrow you add a new \`Bird\` class that chirps, you do NOT have to modify existing drawing or sound loops. You just conform to the contract.
- **Maintainability:** Code consumers don't need large \`if/else\` or \`switch\` chains checking \`if (type === 'dog')\`.

#### Practical Walkthrough
\`\`\`python
class PaymentGateway:
    def process_payment(self, amount: float):
        raise NotImplementedError()

class CreditCardPayment(PaymentGateway):
    def process_payment(self, amount: float):
        print(f"Authorizing \${amount} with Visa/Mastercard")

class PayPalPayment(PaymentGateway):
    def process_payment(self, amount: float):
        print(f"Redirecting \${amount} to PayPal secure token")

# Checkout function does not care which payment processor is used:
def checkout(gateway: PaymentGateway, total: float):
    gateway.process_payment(total)
\`\`\`

#### Summary
Polymorphism lets software remain open for expansion but closed for modification (the Open/Closed Principle).`
    },
    claude: {
      perspective: 'Pedagogical Taxonomy & Subtyping vs Ad-Hoc Nuances',
      approach: 'Examines linguistic etymology, Cardelli & Wegner classification (Subtyping, Parametric, Ad-hoc), and behavioral contracts (Liskov Substitution Principle).',
      answer: `### Deep Dive: Polymorphism in Software Engineering

To truly master polymorphism, we should look at its formal academic taxonomy first formulated by Luca Cardelli and Peter Wegner (1985).

#### 1. Etymology & Foundational Definition
Derived from Greek:
- **Poly** = Many
- **Morphe** = Form, shape

In computer science, polymorphism is the provision of a single interface to entities of different data types.

#### 2. The Theoretical Classification
1. **Universal Polymorphism**:
   - **Subtyping (Inclusion Polymorphism):** What most programmers refer to in OOP. A name may denote instances of many different classes as long as they share a common supertype. Governed strictly by the **Liskov Substitution Principle (LSP)**: *Subtypes must be substitutable for their base types without altering program correctness.*
   - **Parametric Polymorphism:** Often called **Generics** or **Templates** (e.g., \`List<T>\` in C# or Java). The same algorithmic logic works uniformly regardless of the type parameter.

2. **Ad-Hoc Polymorphism**:
   - **Overloading:** Distinct functions sharing the same identifier, differentiated by formal parameters.
   - **Coercion:** Implicit type conversion performed by the compiler/runtime (e.g., treating an integer as a float in arithmetic).

#### 3. Why It Matters for Clean Architecture
Without polymorphism, programs degenerate into brittle procedural branch checking. Polymorphism replaces runtime conditionals with dynamic dispatch, cleanly decoupling clients from volatile low-level details.

#### Student Caution
Overusing inheritance solely to gain polymorphism can lead to fragile deep class hierarchies. Modern practice favors composition with interfaces.`
    },
    deepseek: {
      perspective: 'Low-Level Runtime Mechanics & VTable Memory Architecture',
      approach: 'Explains how compilers actually implement dynamic dispatch using Virtual Method Tables (vtables) and pointer dereferencing, highlighting runtime performance implications.',
      answer: `### Low-Level Engineering View: How Polymorphism Actually Works Under the Hood

While textbooks describe polymorphism as "many forms," a systems engineer should understand **how the CPU and compiler resolve it at runtime**.

#### 1. The Virtual Method Table (vtable) Architecture
When a class declares a \`virtual\` method (in C++ or default methods in Java):
1. The compiler generates a hidden table of function pointers called a **vtable** for that class.
2. Every instantiated object has a hidden pointer inserted as its first memory member: the **vptr** (virtual pointer).
3. The \`vptr\` points directly to the class's \`vtable\` in the binary's read-only data segment.

#### 2. Memory Layout Diagram
\`\`\`text
[ Object in Memory ]          [ Virtual Table (vtable) in RAM ]
+-------------------+         +--------------------------------+
| vptr  ----------->| ------> | &Dog::makeSound() [0x004012A0] |
| age: 4            |         | &Dog::eat()       [0x004012F0] |
| name: "Buddy"     |         +--------------------------------+
+-------------------+
\`\`\`

#### 3. The Execution Cost: Dynamic Dispatch
When you execute \`animal->makeSound()\`:
1. Dereference object pointer to access object memory.
2. Dereference \`vptr\` to locate the vtable.
3. Fetch the function pointer at the specific method index offset.
4. Jump instruction (\`call\`) to that address.

**Performance Impact:**
- Slight indirection penalty (2 pointer dereferences).
- Prevents direct compiler inlining in hot loops unless devirtualization optimization triggers.

#### Key Takeaway
Dynamic polymorphism trades a minuscule runtime dispatch cost for massive architectural decoupling and pluggability.`
    },
    synthesis: {
      simpleExplanation: `Polymorphism means **"one interface, many forms."** 

Imagine you have a single green "Power" button on a universal remote. When you press it facing a television, it turns on a screen. When you press that exact same button facing an air conditioner, it starts cooling the room. You (the caller) only need to know how to press "Power"—each specific appliance knows how to respond in its own unique way. 

In programming, polymorphism lets you write code that tells different objects to do something (like \`animal.makeSound()\`), and each object executes its own specific behavior (\`Dog\` barks, \`Cat\` meows) without you needing to check what kind of animal it is first.`,
      detailedExplanation: `Polymorphism allows objects of different classes to be accessed through a unified interface. It is divided into two primary categories:

1. **Compile-Time Polymorphism (Static Binding):**
   - **Method Overloading:** Creating multiple methods with the exact same name but different argument counts or types.
   - **Operator Overloading:** Customizing how operators like \`+\` or \`*\` behave for user-defined types.
   - The compiler determines exactly which version to call before the program runs.

2. **Runtime Polymorphism (Dynamic Binding):**
   - **Method Overriding:** A subclass provides a specific implementation of a method defined in its superclass or interface.
   - The decision of which method to run happens while the program is actively executing, facilitated by internal lookup structures (virtual tables).
   - This adheres to the **Liskov Substitution Principle**, ensuring that derived classes can replace base classes safely without breaking caller logic.`,
      example: {
        language: 'typescript',
        codeOrContext: `// 1. Define the shared interface (Contract)
interface Shape {
  calculateArea(): number;
}

// 2. Concrete implementation A
class Circle implements Shape {
  constructor(private radius: number) {}
  calculateArea(): number {
    return Math.PI * this.radius * this.radius;
  }
}

// 3. Concrete implementation B
class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  calculateArea(): number {
    return this.width * this.height;
  }
}

// 4. Polymorphic consumer: Works for ANY shape!
function printTotalArea(shapes: Shape[]): void {
  const total = shapes.reduce((sum, s) => sum + s.calculateArea(), 0);
  console.log(\`Total surface area: \${total.toFixed(2)}\`);
}

printTotalArea([new Circle(5), new Rectangle(4, 6)]);`,
        explanation: 'The `printTotalArea` function does not care whether a shape is a circle, square, rectangle, or a custom polygon added five years later. As long as it conforms to the `Shape` interface, the code works seamlessly.'
      },
      importantPoints: [
        'Polymorphism decouples caller logic from concrete class implementations, drastically improving code maintainability.',
        'Compile-time polymorphism is resolved during compilation (faster execution, zero runtime lookup overhead).',
        'Runtime polymorphism relies on method overriding and dynamic dispatch (slight vtable lookup cost, but maximum flexibility).',
        'Always respect the Liskov Substitution Principle: child classes should honor the contracts promised by their parents.',
        'Prefer composition with interfaces over deep, brittle inheritance trees when designing modern systems.'
      ],
      quickSummary: 'Polymorphism allows different objects to respond to the same method call in their own unique ways. It eliminates messy switch-statements, enables extensible plugin-like code, and comes in two flavors: static (overloading) and dynamic (overriding).',
      practiceQuestions: [
        {
          id: 'pq-1',
          question: 'What is the primary difference between method overloading and method overriding?',
          hint: 'Think about when each one is resolved: at compile time vs at runtime.'
        },
        {
          id: 'pq-2',
          question: 'How does polymorphism help eliminate long if-else or switch chains in your code?',
          hint: 'Consider what happens when you need to add a third or fourth animal type.'
        },
        {
          id: 'pq-3',
          question: 'Under the hood, what mechanism do C++ compilers use to support dynamic polymorphism?',
          hint: 'Review DeepSeek’s low-level explanation regarding function pointers.'
        }
      ],
      consensusSummary: 'All four models agree that polymorphism provides a unified interface for disparate underlying types, separating static (compile-time) from dynamic (runtime) dispatch. ChatGPT and Gemini highlighted clean OOP design and intuitive analogies, Claude contributed theoretical rigor (Cardelli-Wegner taxonomy & Liskov Substitution), and DeepSeek exposed internal vtable pointers and CPU indirection.',
      agreements: [
        'Core definition: "One interface, multiple implementations".',
        'Distinction between compile-time (overloading) and runtime (overriding).',
        'Major benefit is decoupling calling code from concrete classes and enabling easy system extensibility.'
      ],
      differencesOrNuances: [
        'ChatGPT & Gemini focus heavily on clean high-level OOP class diagrams and behavioral analogies.',
        'Claude uniquely breaks down the formal Cardelli-Wegner classification (Subtyping vs Parametric Generics vs Ad-Hoc).',
        'DeepSeek uniquely details the vtable/vptr memory footprint and runtime CPU jump overhead.'
      ]
    },
    quizQuestions: [
      {
        id: 'q1',
        type: 'mcq',
        question: 'Which concept allows the same interface or method call to represent different underlying forms?',
        options: ['Encapsulation', 'Polymorphism', 'Data Hiding', 'Multiple Inheritance'],
        correctAnswer: 'Polymorphism',
        explanation: 'Polymorphism (from Greek "poly" many + "morph" form) enables a single interface to control different underlying implementations.'
      },
      {
        id: 'q2',
        type: 'mcq',
        question: 'Method Overriding is an example of which kind of polymorphism?',
        options: ['Compile-time polymorphism', 'Runtime / Dynamic polymorphism', 'Parametric polymorphism', 'Coercion polymorphism'],
        correctAnswer: 'Runtime / Dynamic polymorphism',
        explanation: 'Method overriding is resolved at runtime using dynamic dispatch (vtables), making it runtime polymorphism.'
      },
      {
        id: 'q3',
        type: 'true_false',
        question: 'In method overloading, methods must have the same name and the exact same parameter list.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'False! In method overloading, the methods share the same name but MUST differ in their parameter signatures (types, order, or count).'
      },
      {
        id: 'q4',
        type: 'true_false',
        question: 'The Liskov Substitution Principle states that subtypes must be substitutable for their base types without altering program correctness.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'True. This is a foundational principle of object-oriented design and subtyping polymorphism.'
      },
      {
        id: 'q5',
        type: 'short_answer',
        question: 'What is the name of the internal table of function pointers used by compilers to resolve virtual method calls at runtime?',
        correctAnswer: 'vtable',
        explanation: 'The vtable (virtual method table) stores function pointers to the appropriate overridden implementations for each class.'
      }
    ],
    notes: {
      topic: 'Polymorphism in Object-Oriented Programming',
      definition: 'Polymorphism is an OOP principle enabling entities of different data types to be manipulated through a unified, shared interface.',
      keyConcepts: [
        'Compile-time Polymorphism: Static binding via Method Overloading and Operator Overloading.',
        'Runtime Polymorphism: Dynamic binding via Method Overriding and Abstract Base Classes / Interfaces.',
        'Dynamic Dispatch: Runtime lookup using virtual tables (vtables) and object virtual pointers (vptrs).',
        'Liskov Substitution Principle (LSP): Subtypes must remain fully substitutable for their supertypes.'
      ],
      examples: `// Interface contract:
interface Notifier {
  send(message: string): void;
}

class EmailNotifier implements Notifier {
  send(msg: string) { /* SMTP delivery */ }
}

class SMSNotifier implements Notifier {
  send(msg: string) { /* Twilio SMS */ }
}

// Consumer function:
function broadcastAlert(notifier: Notifier, alert: string) {
  notifier.send(alert); // Polymorphic call
}`,
      importantTerms: [
        { term: 'Method Overriding', definition: 'Redefining a superclass method in a subclass with matching signature.' },
        { term: 'Method Overloading', definition: 'Defining methods with identical names but differing parameter types/counts.' },
        { term: 'vtable (Virtual Table)', definition: 'Compiler-generated array of function pointers used for dynamic dispatch.' },
        { term: 'Dynamic Binding', definition: 'Linking a method call to its executable code body at runtime rather than compile-time.' }
      ],
      examPoints: [
        'State Greek roots: poly (many) + morph (form).',
        'Be ready to write a 4-line example showing a base interface and two concrete classes.',
        'Contrast Overloading (compile-time, same class, different params) vs Overriding (runtime, parent-child, identical signature).',
        'Mention runtime tradeoff: vtable pointer dereferencing prevents immediate inline optimization.'
      ],
      lastEdited: Date.now()
    }
  }
];

export function generateEducationalResponse(
  question: string, 
  models: AIProvider[],
  document?: UploadedDocument
): {
  responses: Record<AIProvider, AIModelResponse>;
  synthesis: SynthesisResult;
  quizQuestions: QuizQuestion[];
  notes: StudyNote;
} {
  const qLower = question.toLowerCase();
  
  // Find matching pre-crafted knowledge or synthesize dynamically
  const match = !document ? KNOWLEDGE_BASE.find(item => 
    item.keywords.some(k => qLower.includes(k))
  ) : null;

  if (match) {
    const responses: Record<AIProvider, AIModelResponse> = {} as any;
    
    models.forEach(model => {
      const data = match[model];
      responses[model] = {
        provider: model,
        modelName: model === 'chatgpt' ? 'GPT-4o' : model === 'gemini' ? 'Gemini 3.8 Flash' : model === 'claude' ? 'Claude 3.5 Sonnet' : 'DeepSeek V3',
        answer: data.answer,
        latencyMs: 780 + Math.floor(Math.random() * 650),
        status: 'success',
        perspectiveHighlight: data.perspective,
        keyApproach: data.approach,
      };
    });

    return {
      responses,
      synthesis: match.synthesis,
      quizQuestions: match.quizQuestions,
      notes: match.notes,
    };
  }

  // Dynamic generative response for any other subject/topic entered by student or extracted from document!
  const topicName = document 
    ? (question.trim() ? `${extractTopicName(question)} (Ref: ${document.name})` : `Lecture Analysis: ${document.name}`)
    : extractTopicName(question);
    
  const docExcerpt = document?.text 
    ? document.text.slice(0, 300).replace(/\n+/g, ' ') 
    : '';

  const docNote = document 
    ? `\n\n> 📄 **Document Source:** Analyzed from uploaded lecture \`${document.name}\` (~${document.wordCount.toLocaleString()} words).` 
    : '';
  const responses: Record<AIProvider, AIModelResponse> = {} as any;

  if (models.includes('chatgpt')) {
    responses.chatgpt = {
      provider: 'chatgpt',
      modelName: 'GPT-4o',
      latencyMs: 820,
      status: 'success',
      perspectiveHighlight: document ? 'Syllabus & Lecture Document Decomposition' : 'Structured Educational Breakdown',
      keyApproach: document ? 'Extracts core lecture taxonomy, section hierarchies, and defined terminology.' : 'Direct conceptual definitions, core taxonomy, and step-by-step component analysis.',
      answer: `### Educational Overview: ${topicName}
${docNote}

When approaching **${topicName}**, it helps to view it through three fundamental stages: definition, core mechanics, and common applications.${document ? `\n\n**Key Lecture Focus Identified:**\n"${docExcerpt}..."` : ''}

#### 1. What Is It?
${topicName} is a foundational concept designed to solve specific challenges by establishing clear rules, boundaries, and repeatable workflows.

#### 2. Core Pillars
- **Fundamental Rule:** Governed by established principles that guarantee predictable outcomes.
- **Workflow / Process:** Executes in logical, sequential stages from initial inputs to final state.
- **Key Advantage:** Simplifies reasoning about complex systems and prevents common failure modes.

#### 3. Practical Example
In real-world problem solving, ${topicName} allows practitioners to decompose large, overwhelming challenges into manageable sub-problems with clear verification criteria.

#### Key Takeaway for Students
Always look for the underlying pattern rather than memorizing isolated formulas or code fragments.`
    };
  }

  if (models.includes('gemini')) {
    responses.gemini = {
      provider: 'gemini',
      modelName: 'Gemini 3.8 Flash',
      latencyMs: 640,
      status: 'success',
      perspectiveHighlight: 'Intuitive Analogies & Big-Picture Context',
      keyApproach: 'Relates abstract technical concepts to everyday physical phenomena to ensure lasting memory retention.',
      answer: `### Big Picture & Intuitive Analogy: ${topicName}

If you want to understand **${topicName}**, avoid starting with intimidating jargon. Instead, visualize an everyday system.

#### The Intuitive Analogy
Imagine an airport flight dispatch tower or a postal routing center. Without an agreed-upon protocol, chaos ensues. ${topicName} acts like the universal dispatch protocol—everyone knows exactly what token to hold, when to wait, and when to proceed safely.

#### Why We Need It
- **Eliminates ambiguity:** Guarantees that different independent components speak the same dialect.
- **Resilience:** Helps systems recover cleanly if unexpected disturbances occur.
- **Scalability:** The rules remain just as clean whether handling 2 units or 2,000,000 units.

#### Student Pro-Tip
Whenever you encounter ${topicName} in exams, ask yourself: *"What problem would occur if this mechanism didn't exist?"* The answer immediately reveals its purpose!`
    };
  }

  if (models.includes('claude')) {
    responses.claude = {
      provider: 'claude',
      modelName: 'Claude 3.5 Sonnet',
      latencyMs: 950,
      status: 'success',
      perspectiveHighlight: 'Pedagogical Depth & Boundary Conditions',
      keyApproach: 'Analyzes why the concept exists, edge cases, historical evolution, and common student misconceptions.',
      answer: `### Academic & Conceptual Breakdown: ${topicName}

To master **${topicName}**, we should examine both its theoretical underpinnings and its critical boundary conditions.

#### 1. Theoretical Grounding
The emergence of ${topicName} was driven by the necessity to maintain deterministic behavior in non-trivial systems. Historically, early approaches suffered from edge-case vulnerabilities, which this model systematically neutralizes.

#### 2. Common Misconceptions
- **Mistake 1:** Assuming ${topicName} carries zero overhead. In reality, there is always a deliberate tradeoff between expressiveness and execution complexity.
- **Mistake 2:** Conflating the surface interface with internal state management.

#### 3. Critical Thinking Question
When applying ${topicName}, always verify the preconditions. If the underlying data or state is corrupted, the guarantees no longer hold.`
    };
  }

  if (models.includes('deepseek')) {
    responses.deepseek = {
      provider: 'deepseek',
      modelName: 'DeepSeek V3',
      latencyMs: 1100,
      status: 'success',
      perspectiveHighlight: 'Mechanisms, Systems & Practical Execution',
      keyApproach: 'Deep dive into underlying mechanisms, efficiency factors, and practical implementation considerations.',
      answer: `### Core Mechanics & Systematic Analysis: ${topicName}

From a rigorous analytical perspective, **${topicName}** must be understood through its underlying operational mechanics and efficiency factors.

#### 1. Fundamental Mechanics & Flow
- **Primary Driver:** Operates through well-defined input transformations and governing rules.
- **Resource & Energy Flow:** Examines how inputs are consumed, transformed, and preserved across state changes.
- **System Constraints:** Identifies the natural physical, mathematical, or procedural limits governing execution.

#### 2. Critical Points & Pitfalls
- Verify all boundary conditions and environmental dependencies before drawing conclusions.
- Distinguish between primary driving factors and secondary correlations.

#### 3. Systematic Summary
${topicName} establishes consistent, verifiable outcomes when all operational criteria are satisfied.`
    };
  }

  const synthesis: SynthesisResult = {
    simpleExplanation: `**${topicName}** is a foundational concept that explains how a particular process or mechanism works in a predictable, orderly way.

Think of it like an interconnected recipe: specific ingredients or starting conditions undergo organized transformations to produce essential, dependable outcomes.`,
    detailedExplanation: `In academic and practical contexts, **${topicName}** operates across three core dimensions:

1. **Governing Principles:** The fundamental natural, logical, or empirical laws that define how it works.
2. **Sequential Stages:** The step-by-step progression from initial inputs through intermediate transformations to final results.
3. **Real-World Significance:** Why understanding this concept is essential for problem-solving, real-world applications, and academic mastery.`,
    example: {
      language: 'markdown',
      codeOrContext: `Core Concept Walkthrough: ${topicName}
1. Define the initial conditions and requirements.
2. Observe or execute the primary transformation mechanism.
3. Verify the resulting output against expected principles.`,
      explanation: `By following the fundamental rules of ${topicName}, outcomes remain consistent and verifiable across different scenarios.`
    },
    importantPoints: [
      `Mastering ${topicName} requires grasping the underlying cause-and-effect relationship.`,
      'Focus on the core mechanism rather than memorizing disconnected facts.',
      'Identify how changes to starting conditions alter the final output.',
      'Review real-world applications to reinforce long-term understanding.'
    ],
    quickSummary: `${topicName} provides a clear, reliable explanation of how specific conditions produce predictable, vital outcomes.`,
    practiceQuestions: [
      {
        id: 'pq-dyn-1',
        question: `In your own words, what primary challenge does ${topicName} resolve?`,
        hint: 'Consider what problems occur when this concept is absent.'
      },
      {
        id: 'pq-dyn-2',
        question: `What are the primary tradeoffs or considerations when applying ${topicName}?`,
        hint: 'Think about runtime overhead vs structural clarity.'
      },
      {
        id: 'pq-dyn-3',
        question: `How would you explain the core mechanism of ${topicName} to a beginner?`,
        hint: 'Use Gemini’s analogy method.'
      }
    ],
    consensusSummary: document 
      ? `All selected models analyzed your attached lecture document "${document.name}" (~${document.wordCount.toLocaleString()} words). ChatGPT structured the lecture's core syllabus topics, Gemini provided real-world analogies, Claude validated academic terms, and DeepSeek evaluated implementation and performance considerations.`
      : `All selected models agreed on the core premise of ${topicName}. ChatGPT emphasized structural categorization, Gemini provided intuitive relational analogies, Claude highlighted theoretical boundaries, and DeepSeek detailed efficiency and performance considerations.`,
    agreements: [
      document 
        ? `Consensus on core concepts extracted from "${document.name}".`
        : `Universal agreement on the definition and importance of ${topicName}.`,
      'Consensus that structuring systems according to these principles reduces errors and increases maintainability.'
    ],
    differencesOrNuances: [
      document 
        ? 'ChatGPT focused on syllabus structure and conceptual categorization.'
        : 'ChatGPT highlighted structured taxonomies and standard workflows.',
      'Gemini stressed intuitive analogies and big-picture cognitive models.',
      'Claude addressed academic rigor and common student pitfalls.',
      'DeepSeek focused on memory footprints and algorithmic optimization.'
    ]
  };

  const quizQuestions: QuizQuestion[] = [
    {
      id: 'qd-1',
      type: 'mcq',
      question: document 
        ? `Based on the lecture document "${document.name}", what is the primary objective of ${topicName}?`
        : `What is the primary motivation for studying and applying ${topicName}?`,
      options: [
        'To increase complexity and code length',
        'To provide structure, predictability, and reduce errors',
        'To bypass all compiler optimizations',
        'To force manual memory management'
      ],
      correctAnswer: 'To provide structure, predictability, and reduce errors',
      explanation: 'The primary goal is to establish predictable behavior and modularity across systems.'
    },
    {
      id: 'qd-2',
      type: 'true_false',
      question: `True or False: Applying ${topicName} guarantees that you never have to consider edge cases or input validity.`,
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'False! Boundary conditions and valid preconditions must always be verified.'
    },
    {
      id: 'qd-3',
      type: 'short_answer',
      question: `Which AI perspective focused primarily on low-level performance, cache locality, and runtime overhead?`,
      correctAnswer: 'DeepSeek',
      explanation: 'DeepSeek emphasized systems-level performance, memory layout, and runtime optimization tradeoffs.'
    }
  ];

  const notes: StudyNote = {
    topic: topicName,
    definition: `${topicName} is a fundamental concept that provides structure, predictability, and systematic clarity in problem solving.`,
    keyConcepts: [
      'Foundational Rule: Defines clear invariants and predictable outcomes.',
      'Modularity: Decomposes complex problems into verifiable, independent components.',
      'Tradeoff Awareness: Balances structural overhead against maintainability and cognitive clarity.'
    ],
    examples: `Practical Walkthrough for ${topicName}:
- Establish initial baseline state
- Apply standard verified transformation
- Validate output integrity against criteria`,
    importantTerms: [
      { term: 'Deterministic Behavior', definition: 'Producing the exact same output given the exact same starting conditions.' },
      { term: 'Invariant', definition: 'A condition that remains true throughout the execution of a process.' },
      { term: 'Abstraction', definition: 'Hiding unnecessary implementation details while exposing a clean interface.' }
    ],
    examPoints: [
      `Clearly state the definition and purpose of ${topicName}.`,
      'Provide at least one real-world analogy to demonstrate deep understanding.',
      'List the key tradeoffs (overhead vs clarity).',
      'Mention edge-case considerations.'
    ],
    lastEdited: Date.now()
  };

  return {
    responses,
    synthesis,
    quizQuestions,
    notes
  };
}

export function generateFollowUpAnswer(
  session: { question: string; synthesis: SynthesisResult },
  studentFollowUp: string,
  history: FollowUpMessage[]
): string {
  const q = studentFollowUp.toLowerCase();
  
  if (q.includes('simple') || q.includes('beginner') || q.includes('easier') || q.includes('5 year old') || q.includes('still don\'t understand')) {
    return `No problem at all! Let's strip away all the jargon and look at this using a simple real-world story.

Imagine you are playing a video game where your character has a button labeled **"Interact"**.

- When you stand in front of a **Chest** and press "Interact", the chest opens and reveals treasure.
- When you stand in front of a **NPC Villager** and press "Interact", they speak to you.
- When you stand in front of a **Vehicle** and press "Interact", you climb into the driver seat.

Notice that your game controller only has **ONE** button: "Interact". You don't have a 50-button controller with a "Chest Button", a "Talk Button", and a "Drive Button". 

The game code simply says: \`target.interact()\`. Each object in the game world knows its own custom behavior!

Does that make the concept click better? Feel free to ask how this translates to code or exams!`;
  }

  if (q.includes('code') || q.includes('python') || q.includes('java') || q.includes('c++') || q.includes('javascript') || q.includes('typescript')) {
    return `Here is a clear, concise code demonstration illustrating this:

\`\`\`python
# 1. The common base contract
class Device:
    def turn_on(self):
        pass

# 2. Specialized forms
class Lamp(Device):
    def turn_on(self):
        print("💡 Light illuminates the desk")

class Fan(Device):
    def turn_on(self):
        print("💨 Blades spin and generate cool breeze")

# 3. Polymorphic runner
def power_up_room(devices: list[Device]):
    for item in devices:
        item.turn_on() # Notice: one uniform method call!

# Execution:
room = [Lamp(), Fan()]
power_up_room(room)
\`\`\`

Notice that the function \`power_up_room\` never checks \`if type(item) == Lamp\`. It simply calls \`turn_on()\`, and Python dispatches the appropriate method dynamically.`;
  }

  if (q.includes('exam') || q.includes('test') || q.includes('interview')) {
    return `For exams and technical interviews, professors and interviewers typically look for these 3 specific points:

1. **Definition & Etymology:** Mention "many forms" and explain that it enables a single interface to represent multiple distinct types.
2. **The 2 Main Types:** Clearly distinguish between:
   - **Static (Compile-time):** Method overloading and operator overloading.
   - **Dynamic (Runtime):** Method overriding via virtual methods / interfaces.
3. **The 'Why':** Explain that it eliminates messy \`switch\` / \`if-else\` cascades and supports the **Open/Closed Principle** (open for extension, closed for modification).

If you include those 3 points plus a 3-line code example, you will reliably earn full marks!`;
  }

  return `That is a great follow-up question! 

Building directly on our discussion of **${session.question}**:

When dealing with this in real software systems, the key is keeping the contracts concise. When interfaces are small and focused (adhering to the Interface Segregation Principle), different parts of your program can swap implementations with zero friction.

Would you like to explore:
1. A code example in another programming language?
2. How to practice with a quiz?
3. Or generating a printable study sheet with exam points?`;
}

function extractTopicName(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^(explain|what is|how does|compare|tell me about|describe|why is|difference between)\s+/i, '');
  cleaned = cleaned.replace(/\s+(in simple english|in simple terms|for beginners|in oop|in c\+\+|in python|\?)$/i, '');
  if (!cleaned || cleaned.length < 3) return 'Computer Science & Concept Study';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
