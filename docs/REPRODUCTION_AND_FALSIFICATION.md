# Strategic Reproduction and Falsification

Sovryn treats reproduction and falsification as strategy work, not as optional
post-processing.

The reproduction queue asks:

- Which promising unproven result needs independent confirmation?
- Which synthetic-only result needs real/proxy validation?
- Which claim has enough public value to justify an independent check?

The falsification queue asks:

- What safe counterexample class could weaken this claim?
- Which baseline challenge might beat the candidate?
- Which edge case exposes instability, overfitting, or missing evidence?

Bounded queue execution records partial reproduction, failed reproduction,
survived falsification, weakened claims, and limitations without overclaiming.
Queue results update scientific memory before they can influence future
strategy.
