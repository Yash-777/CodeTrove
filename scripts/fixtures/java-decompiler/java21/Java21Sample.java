package samples.java21;

public class Java21Sample {
    public static String classify(Object value) {
        return switch (value) {
            case String text when !text.isBlank() -> text;
            case String text -> "blank";
            case Integer number -> number.toString();
            default -> "other";
        };
    }
}
