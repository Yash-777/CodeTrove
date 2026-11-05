package samples.java17;

public record Java17Sample(String name, int visits) {
    public static String classify(Object value) {
        return value instanceof String text ? text : "other";
    }
}
