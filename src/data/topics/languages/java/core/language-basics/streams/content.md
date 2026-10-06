# Streams

Java Streams describe a lazy pipeline of operations over a data source. Intermediate operations such as `filter` and `map` compose transformations; a terminal operation such as `toList` or `reduce` executes the pipeline.

This navigation entry reuses the existing detailed guide rather than maintaining a duplicate:

[Open the Java Streams guide](/content/java/streams)

Prefer ordinary loops when they make mutation, early exit, or complex control flow clearer. Parallel streams use shared runtime resources and are not automatically faster, especially for blocking work.
