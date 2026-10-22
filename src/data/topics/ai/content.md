# AI & Machine Learning: From Models to Production Systems

Artificial intelligence is a broad field concerned with systems that perform tasks associated with perception, language, prediction, planning, or decision-making. This guide builds from the basic vocabulary to the design of production applications that use large language models (LLMs). It focuses on concepts that remain useful as individual model names, versions, and benchmark rankings change.

## A map of the terms

**Artificial intelligence (AI)** is the broad area. **Machine learning (ML)** is a way to build some AI systems by fitting a model to data rather than writing every decision as a fixed rule. **Deep learning** uses neural networks with many learned layers. **Generative AI** describes systems that create new outputs, such as text, images, audio, or code. An **LLM** is a language-focused model trained to process and generate sequences of tokens at large scale.

These terms describe different levels, not competing product types. An LLM is a deep-learning model; it is one kind of generative-AI technology; and a generative-AI application may combine an LLM with search, a database, tools, and conventional software.

```text
AI application
├── User interface and application logic
├── Model call (LLM, vision, speech, or another model)
├── Optional retrieval (search / database / vector index)
├── Optional tools (approved APIs and actions)
└── Evaluation, privacy, security, and observability
```

The model is only one component. A useful production feature is the entire controlled system around it.

## What is a model?

A **model** is a learned function that maps an input to an output distribution or prediction. During training, an optimizer adjusts numerical values called **parameters** (or weights) so the model's outputs fit the training objective. During inference, the trained weights are used to produce an answer for a new input; ordinary inference does not automatically rewrite the model's weights.

A model has several related but distinct properties:

- Its **architecture** is the design of the computation, such as a Transformer network.
- Its **weights** are the learned parameter values produced by training or fine-tuning.
- Its **tokenizer** maps text into token IDs and maps output IDs back into text. A token can be a word, word fragment, punctuation mark, or other unit; a token is not the same thing as a character or a word.
- Its **context window** is the maximum input/output context the model can process for one request, measured in tokens or another provider-defined unit. The exact accounting can include instructions, conversation history, retrieved passages, tool results, and generated output.
- Its **inference configuration** includes model-specific settings such as maximum output length, sampling parameters, and structured-output constraints.

A **model family** is a related group of models. A **model version or checkpoint** identifies a particular trained release. A model name alone does not describe quality, speed, safety, context capacity, cost, data retention, or service availability. Those must be checked for the exact provider and deployment being considered.

### Foundation models and model categories

A **foundation model** is trained on broad data and can be adapted to many tasks. An LLM is commonly used as a foundation model for language tasks, but not every language model has the same training, modality, license, or intended use.

Useful categories include:

- **General-purpose language models**, which handle a broad range of language and reasoning tasks.
- **Instruction-tuned models**, which have been further trained to respond to user instructions in a conversational or task-oriented format.
- **Embedding models**, which map input such as text into vectors useful for similarity search or retrieval. They generally produce vectors rather than a conversational answer.
- **Reranking models**, which score a set of retrieved items for relevance to a query.
- **Multimodal models**, which accept or produce more than one modality, such as text plus image or audio.
- **Small or locally runnable models**, which may reduce network dependence or enable on-device use, with trade-offs in capability, memory, and latency.

These are functional descriptions, not a ranking. Check actual task performance and deployment constraints rather than assuming a larger, newer, or more popular model is automatically the best fit.

## How an LLM produces text

Many text-generation LLMs are autoregressive: given the current token sequence, they estimate a probability distribution for the next token. The system selects a token according to its decoding configuration, appends it to the sequence, and repeats until it reaches a stopping condition or output limit.

A Transformer uses attention mechanisms to compute relationships among tokens in the current context. In simplified terms, attention helps a layer combine information from different positions. Multiple layers transform token representations; the final state is used to score possible next tokens. This is a useful mental model, but it is not a claim that the system searches a database of memorized sentences or reasons exactly like a person.

```text
instruction + user input + relevant context
                    │
                    ▼
              tokenizer → token IDs
                    │
                    ▼
       model computes next-token scores
                    │
          decoding selects a token
                    │
         append token and repeat ───────┐
                    │                   │
                    └── stop condition ◀┘
                    │
                    ▼
             generated response
```

### Tokens and context windows

Tokens are the model's processing units. Token counts vary by tokenizer and language, so do not estimate a token budget by counting words alone. Code, URLs, unusual formatting, non-English text, and images or audio can have different tokenization or modality-specific accounting.

The **context window** is not the same as persistent memory. It limits what can be included in one inference request. If a conversation exceeds the usable context, the application may need to summarize, select relevant history, retrieve stored information, or start a new context. Larger context also has cost and latency implications and does not guarantee that every included detail receives equal attention.

## Training and adaptation

An LLM's development and deployment may include several separate stages:

1. **Pretraining** learns general patterns from a large training corpus using a self-supervised objective. For a next-token model, a common objective is to predict a following token from earlier tokens.
2. **Supervised fine-tuning (SFT)** trains the model on curated input/output examples so its responses better match a desired task or format.
3. **Preference or alignment training** uses demonstrations, comparisons, or other feedback to steer behavior toward selected qualities, such as helpfulness or safety. The methods and guarantees depend on the system.
4. **Inference** uses a deployed model to answer requests. Inference-time prompting, retrieval, and tool calls can change the response without changing the underlying model weights.

A **fine-tuned model** has updated weights. A **prompted model** receives different instructions or examples for a request while retaining its deployed weights. A **RAG system** retrieves external information at request time and provides it as context; retrieval itself does not fine-tune the LLM.

## Prompting and generation controls

A prompt is the structured input sent to a model. A robust application separates trusted instructions from user data, supplies only relevant context, specifies output expectations, and validates the result before using it. Clear prompts help, but they cannot make an unreliable model perfect or enforce a security boundary by themselves.

**Temperature** changes how probability mass is distributed during token sampling: lower values generally make sampling less varied, and higher values generally allow more variation. **Top-p** sampling considers a probability-ranked set of tokens whose cumulative probability reaches a configured threshold. Providers may support different controls or combinations. Neither setting is a direct accuracy knob, and temperature zero should not be promised to make every hosted system perfectly deterministic.

Use constrained formats, schemas, or function/tool-calling interfaces when supported and useful, but still validate output. A response that parses as JSON can contain wrong values, unsafe actions, or unsupported claims.

## RAG: giving a model relevant external knowledge

**Retrieval-augmented generation (RAG)** combines a model with a retrieval step. It is useful when an application needs to answer from a changing, private, or curated body of documents and wants evidence to be traceable to that body.

A typical request follows these steps:

1. Ingest approved source documents and preserve their access controls and metadata.
2. Split documents into meaningful passages. Record source identifiers, page/section details, timestamps, and permissions.
3. Create an embedding for each passage and store the vector alongside the source data in an index. Some systems instead or additionally use keyword search.
4. Convert a user query into a retrieval request; fetch candidate passages using a suitable search strategy.
5. Optionally rerank candidates, enforce user/document authorization, and keep only relevant passages within the model's context budget.
6. Give the model the question and selected evidence, with an instruction to distinguish supported information from missing evidence.
7. Return an answer with citations or source links when possible; log retrieval and answer-quality signals without unnecessarily retaining sensitive text.

Retrieval quality is a key part of answer quality. Poor chunking, stale content, missing metadata, weak search, permission mistakes, or irrelevant passages can produce a bad answer even when the model call itself works. A citation is useful only if the cited passage actually supports the claim.

**Embeddings** are numeric vector representations. Similarity between vectors can help find semantically related content even when the wording differs. Vector similarity is not proof that two passages are factually equivalent, and an embedding model is not the same thing as a generative LLM.

### RAG, fine-tuning, or prompt examples?

Use **prompt instructions** for task framing, tone, response structure, and a small number of examples. Use **RAG** when answers should draw on external facts that change, need source attribution, or are too large to place in every prompt. Consider **fine-tuning** when repeated examples show that a model needs a stable change in task behavior, style, or output pattern and the team can curate and evaluate suitable training data.

They can be combined. RAG is not a magic guarantee of truth, fine-tuning is not a reliable way to keep a knowledge base current, and adding more prompt text is not a substitute for a correct authorization or validation layer.

## Tools, function calling, and agents

A **tool call** lets a model request a defined application capability, such as searching an approved knowledge base or calculating a value. The application—not the model—should validate the request, enforce authorization, execute the operation, and decide what result may be returned to the model or user.

An **agentic workflow** usually adds a loop in which a model observes results and chooses among multiple steps or tools. More autonomy can help with multi-step tasks, but it also increases failure surface, latency, cost, and security risk. Start with a bounded workflow and a small allowlist of actions. Set time, token, and tool-call limits; require confirmation for consequential actions; and make each operation auditable and reversible where practical.

Never treat generated text as executable SQL, shell commands, HTML, or a privileged tool request without parsing, validation, authorization, and safe execution controls. The model is not the security policy.

## Choosing a model and deployment approach

Start with the user task and its failure cost. Make a representative test set and compare candidate models on the same prompts and constraints. Evaluate the exact deployed configuration rather than relying only on a public benchmark or a vendor's model name.

Important trade-offs include:

- **Task quality:** correctness, instruction following, multilingual performance, coding performance, groundedness, and consistency on the domain's real inputs.
- **Latency and throughput:** time to first token, total response time, concurrency limits, queueing, and performance under peak load.
- **Cost:** input and output usage, retries, long conversations, embedding and reranking, tool calls, and operational overhead. A lower price per token may not mean lower total cost if the system needs more tokens or retries.
- **Context and modalities:** required context size and whether the task includes text, images, audio, or other input/output types.
- **Privacy and governance:** what data may leave the environment, retention and training policies, regional requirements, access controls, and contractual terms for the exact service.
- **Operational reliability:** version changes, availability, quotas, fallbacks, monitoring, and the ability to reproduce or roll back an update.
- **Deployment control:** hosted API versus self-hosting or local execution. Local deployment can improve control over the environment and network boundary, but the team takes on hardware, scaling, updates, security, and model-serving operations.
- **License and usage rights:** terms for weights, commercial use, redistribution, and any included data or model components. “Open weights” does not automatically mean the entire training pipeline and dataset are open source.

A common architecture routes simple tasks to a smaller or cheaper model and difficult cases to a stronger model, but routing must be measured. It can add complexity and should be used only if it improves the product's actual quality, cost, or latency targets.

## Evaluation, observability, and safe operation

LLM output is variable, so testing only whether an endpoint returns HTTP 200 is not enough. Build an evaluation set from representative examples, edge cases, and known failure modes. Include human-reviewed expected qualities or acceptable answer ranges, not just exact string matches when multiple phrasings are valid.

Track application-level signals such as task completion, groundedness, citation validity, refusal behavior, user correction rate, latency, token usage, cost, tool errors, retrieval quality, and safety incidents. Use human review for high-impact or ambiguous cases. Protect evaluation data and production logs as sensitive data; redact or minimize fields, define retention, and restrict access.

Treat **prompt injection** as untrusted content attempting to change the system's instructions or induce unsafe behavior. It can appear in user input or retrieved documents. Defenses must be layered: separate instruction from data, restrict tools and permissions, validate arguments, enforce access control outside the model, screen or isolate untrusted content where appropriate, and test adversarial cases. A prompt that says “ignore malicious instructions” is not, by itself, an adequate defense.

Use human review or deterministic rules when an incorrect answer can cause substantial harm. State uncertainty, provide sources, decline unsupported requests, or route to a person when the feature's risk and evidence require it.

## Senior-level interview questions and answers

Each question can be expanded to read the full answer. A strong interview response defines the concept, explains the system flow, identifies trade-offs, and names a way to test or observe the result.

<details>
<summary>What is an LLM, how does it generate an answer, and why should a senior engineer treat it as one component of a larger system?</summary>

An LLM is a neural language model trained to process token sequences and produce a probability distribution over likely next tokens or another task-specific output. In a typical autoregressive generation flow, the model receives tokenized instructions and context, predicts a next token, and continues until a stop condition or output limit is reached.

In a production application, the model does not own authentication, source-of-truth data, authorization, transactions, or business invariants. The application controls which data enters the prompt, which tools are available, how outputs are validated, and what is shown or executed. The model can produce a fluent but unsupported answer, misunderstand ambiguous input, or respond differently to similar requests.

A senior design therefore includes input validation, access control, bounded model and tool calls, output checking, privacy controls, fallback behavior, monitoring, and evaluation. The model's answer quality is one property of the application, not the whole application's correctness.

</details>

<details>
<summary>How do pretraining, supervised fine-tuning, preference alignment, prompting, and inference differ?</summary>

**Pretraining** learns broad patterns from training data using a self-supervised objective. **Supervised fine-tuning** updates model weights with curated examples to improve performance on selected instructions or tasks. **Preference alignment** uses feedback or preference data to steer responses toward selected behaviors; the exact method and resulting guarantees vary.

**Prompting** changes the instructions or examples included in a request, but normally does not update the model weights. **Inference** is the deployed model computing an output from its current input and settings. Retrieval and tool calls may supply additional evidence or capabilities at inference time without changing the weights.

The distinction matters operationally. If facts change frequently, updating a governed retrieval index is usually more direct than retraining model weights. If the behavior pattern is consistently wrong despite good instructions and examples, fine-tuning may be worth evaluating. Neither strategy removes the need for tests and policy enforcement.

</details>

<details>
<summary>What is the difference between a model's architecture, parameters, weights, tokenizer, and context window?</summary>

The **architecture** specifies the model's computational structure. **Parameters** are the learned numeric quantities in the model; **weights** commonly refers to those trained values. The **tokenizer** converts input text into model token IDs and decodes output token IDs. The **context window** limits the sequence and related inputs the model can handle for one inference request.

These properties answer different questions. Architecture describes how computation is organized. Weights describe what was learned during training. Tokenization affects how text consumes the context budget. Context size constrains the request, but it does not mean that the model has persistent memory or will reliably use every included detail.

For production planning, check the actual tokenizer and provider accounting, reserve capacity for the answer and tool results, and test long-context retrieval and attention quality. Do not infer usable capacity from character counts or a model marketing label alone.

</details>

<details>
<summary>What is RAG, and how would you design a retrieval-augmented question-answering flow for internal documentation?</summary>

RAG retrieves relevant source passages at request time and gives those passages to a generative model as context. The model can then form an answer using evidence that may change without updating its weights.

A robust flow ingests approved documents with source IDs, timestamps, and access-control metadata; splits them into coherent passages; embeds and indexes them; retrieves candidates for a query; filters by the current user's authorization; optionally reranks; and passes a bounded evidence set to the model. The application should return citations that map to real, accessible source material and say when the evidence is insufficient.

Evaluate retrieval separately from generation. Measure whether the right passage was found, whether it was permitted for that user, whether the answer is supported by it, and whether the citation points to the correct source. Re-indexing, stale versions, deletion propagation, prompt injection in documents, and tenant isolation are production concerns, not optional details.

</details>

<details>
<summary>When would you choose RAG instead of fine-tuning, and when might you use both?</summary>

Choose **RAG** when the application needs current or private factual material, traceable sources, or a large knowledge base that should not be copied into every prompt. Retrieved data can be updated independently of the model, though the retrieval pipeline itself needs quality and permission checks.

Choose **fine-tuning** when representative evaluation shows a stable behavior gap—such as a recurring domain format or task pattern—that examples and prompt structure do not reliably address, and when suitable training data and an evaluation plan exist. Fine-tuning changes weights; it should not be assumed to provide reliable, instantly updated factual knowledge.

Use both when the application needs a specialized response behavior and must ground answers in up-to-date documents. Keep responsibilities clear: fine-tuning can shape how the model responds, while retrieval provides request-specific evidence. Compare the combined system with simpler baselines for quality, latency, cost, and operational complexity.

</details>

<details>
<summary>What do temperature and top-p control, and why are they not accuracy settings?</summary>

They are decoding controls that affect how candidate tokens are sampled from the model's output distribution. Temperature changes the sharpness of that distribution. Top-p considers a subset of tokens whose cumulative probability reaches a chosen threshold. The available options and their interaction depend on the serving API.

These controls influence variation, not factual verification. A low-temperature answer can still be confidently wrong; a higher-temperature response may be useful for diverse brainstorming but less repeatable. Temperature zero is not a universal promise of bit-for-bit deterministic results across provider infrastructure or model revisions.

Tune settings on the actual task's evaluation set. For creative work, diversity may be valuable; for structured extraction, a more constrained decoding setup plus schema validation may help. In both cases, evaluate semantic correctness separately from format validity.

</details>

<details>
<summary>How would you reduce hallucinations in a system that answers questions about company policy?</summary>

First, narrow the task and require answers to be grounded in approved policy documents. Retrieve current passages with access-control metadata, provide the evidence to the model, and return citations that can be verified. Define what should happen when no relevant evidence is retrieved: ask a clarifying question, state that the source does not answer it, or route to a human.

Then evaluate against realistic questions, including policy conflicts, outdated documents, ambiguous phrasing, missing evidence, and adversarial instructions embedded in source material. Check citation correctness and whether each material claim is supported—not only whether the answer sounds plausible. Monitor user corrections and retrieval failures.

No prompt, retrieval method, or model setting eliminates hallucination in general. Keep high-impact decisions under deterministic policy checks or human review, and avoid presenting generated content as authoritative when the evidence is missing or contradictory.

</details>

<details>
<summary>How should a team select a model for a production feature instead of relying on a benchmark or model ranking?</summary>

Start with the task, users, risk level, and measurable service requirements. Build a representative test set and evaluate candidate models using the same inputs, prompt, retrieved evidence, output contract, and serving conditions. Include ordinary cases, edge cases, long inputs, multilingual or multimodal examples when relevant, and known adversarial cases.

Compare task success and failure severity alongside latency, time to first token, throughput, token usage, end-to-end cost, context needs, privacy terms, data retention, availability, quotas, version stability, deployment control, and licensing. Test the whole application, including retrieval and tools; model-only scores may not predict end-to-end outcomes.

Choose the least complex model that meets the quality and operational targets with an acceptable margin. Keep a rollback plan and rerun evaluations when the model, prompt, retrieval index, or provider configuration changes. The selection is a measured engineering decision, not a permanent ranking.

</details>

<details>
<summary>What is prompt injection, and why is “tell the model to ignore malicious instructions” insufficient security?</summary>

Prompt injection is untrusted content that attempts to override instructions or cause the model to expose information or perform an unintended action. It may arrive directly from a user or inside retrieved pages, documents, or tool output. A model processes those tokens as context and may not reliably distinguish trusted policy from hostile text just because the prompt labels them differently.

The system must enforce security outside the model. Give tools only the minimum permissions required, authorize every call using the real user identity, validate arguments against strict schemas, keep secrets out of prompts, isolate data by tenant, and require confirmation for consequential actions. Treat retrieved content and generated output as untrusted. Use safe rendering and safe execution boundaries.

Test attacks in which content asks the system to ignore policy, reveal hidden data, retrieve another user's material, or invoke an action. Prompt instructions can be one layer, but authorization and validation must be conventional application controls.

</details>

<details>
<summary>What is the difference between a tool-calling model and an autonomous agent, and how would you bound agent risk?</summary>

In tool calling, a model proposes a structured request to a defined capability. The application validates it, checks authorization, executes it, and decides what result to return. The application remains responsible for the action.

An agentic workflow usually repeats this loop: the model receives an observation, selects another step, calls tools, and continues toward a goal. This can help with multi-step work, but it adds opportunities for loops, incorrect plans, prompt injection, accidental side effects, high cost, and long latency.

Start with a deterministic workflow when one is sufficient. For agentic cases, restrict tool allowlists and permissions; bound the number of steps, tokens, time, and spend; make operations idempotent or reversible where possible; require human confirmation for material effects; and log decisions safely. Evaluate both task completion and prohibited-action attempts.

</details>

<details>
<summary>How would you evaluate and monitor an LLM feature after launch?</summary>

Create a versioned evaluation set from representative real tasks and important edge cases. Define how success is judged: exact-match or schema checks where suitable, and reviewed criteria for usefulness, grounding, safety, or completeness where answers can vary. Use human review for high-risk or ambiguous cases, and do not treat a single aggregate score as sufficient.

Monitor end-to-end task success, user corrections or escalations, retrieval precision and coverage, citation support, tool-call validity, refusals, latency, timeouts, retries, token usage, cost, and safety incidents. Track changes across model, prompt, data, and retrieval-index versions so a regression can be traced and rolled back.

Logs and evaluation sets may contain sensitive user data. Minimize collected fields, redact when possible, apply access controls and retention limits, and ensure model/provider terms match the data policy. Run offline evaluation before rollout and use a staged release with a rollback path.

</details>

<details>
<summary>What is the difference between open-weight and open-source models, and how does self-hosting change the engineering trade-off?</summary>

“Open-weight” generally means some trained model weights are available for use under stated terms. “Open source” can imply broader rights and access to the components needed to use, inspect, modify, and redistribute the system; the precise definition and license matter. Available weights do not necessarily include the training data, training code, or unrestricted commercial rights.

Self-hosting can give an organization more control over where data and inference run and over deployment configuration. It also makes the team responsible for hardware capacity, model serving, scaling, patching, monitoring, security, availability, and upgrades. A hosted API moves some of that operations burden to a provider but introduces network dependency, provider terms, quotas, and service-change considerations.

Review the actual license and data-handling terms for the exact model and service. Make the decision using measured task quality, total operating cost, privacy requirements, support needs, and the team's ability to operate the model safely.

</details>

## A practical design checklist

Before shipping a feature that calls a model, be able to answer these questions:

1. What user problem is solved, and why is a model needed rather than ordinary code or search?
2. Which exact input data is sent to which model/provider, and what are the data-retention and access rules?
3. What evidence or tools may the model use, and how are permissions enforced outside the model?
4. How are output format, claims, and actions validated before display or execution?
5. What happens when the model is unavailable, slow, uncertain, over budget, or gives an invalid result?
6. What representative evaluations demonstrate that the full feature meets its quality and safety requirements?
7. What metrics, feedback, versioning, and rollback procedure will reveal and control regressions?

If those answers are unclear, keep the feature in a limited test environment and resolve the gaps before allowing consequential production use.
