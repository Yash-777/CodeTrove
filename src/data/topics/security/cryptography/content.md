# Java Cryptography Utility (SHA-1 / SHA-256 / SHA-512)

This Java 8+ implementation supports enum-driven UI options, runtime-checked AES key lengths, generated or caller-supplied Base64 salt, optional creation-date metadata, reversible encryption/decryption, and SHA digests.

## Important distinction

- **SHA-1, SHA-256, and SHA-512 digests are one-way.** They cannot be decrypted. Use `hash(...)` only when a digest is what you need.
- Reversible encryption uses **AES-GCM**. The selected `KdfAlgorithm` determines whether PBKDF2 uses HMAC-SHA1, HMAC-SHA256, or HMAC-SHA512 to derive the AES key.
- Optional date metadata is authenticated and stored in the envelope; it is **not** used as the AES IV/nonce.
- This version uses a new envelope format and cannot decrypt the old `AES/CBC/PKCS5Padding` values directly.

## `PasswordCrypto.java`

```java
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Provides PBKDF2-based AES-GCM encryption/decryption and one-way SHA digests.
 * The encrypted envelope contains the algorithm, key length, iteration count,
 * salt, random nonce, optional date metadata, and authenticated ciphertext.
 *
 * <p>SHA digests cannot be decrypted. For login-password storage, use a
 * password-hashing scheme rather than reversible encryption.</p>
 */
public final class PasswordCrypto {
    private static final int MAGIC = 0x43545256; // CTRV
    private static final byte VERSION = 1;
    private static final int DEFAULT_ITERATIONS = 600_000;
    private static final int MAX_ITERATIONS = 10_000_000;
    private static final int SALT_BYTES = 16;
    private static final int NONCE_BYTES = 12;
    private static final int TAG_BITS = 128;
    private static final long NO_DATE = Long.MIN_VALUE;
    private static final SecureRandom RANDOM = new SecureRandom();

    private PasswordCrypto() { }

    /** PBKDF2 algorithms supported by the UI and encryption API. */
    public enum KdfAlgorithm {
        PBKDF2_HMAC_SHA1("PBKDF2WithHmacSHA1", 128, 192, 256),
        PBKDF2_HMAC_SHA256("PBKDF2WithHmacSHA256", 128, 192, 256),
        PBKDF2_HMAC_SHA512("PBKDF2WithHmacSHA512", 128, 192, 256);

        private final String jcaName;
        private final int[] keyLengths;

        KdfAlgorithm(String jcaName, int... keyLengths) {
            this.jcaName = jcaName;
            this.keyLengths = keyLengths.clone();
        }

        /** @return JCA SecretKeyFactory algorithm name. */
        public String getJcaName() { return jcaName; }

        /** @return configured AES key lengths in bits. */
        public int[] getConfiguredKeyLengths() { return keyLengths.clone(); }
    }

    /** One-way digest options. A digest cannot be decrypted. */
    public enum DigestAlgorithm {
        SHA1("SHA-1"), SHA256("SHA-256"), SHA512("SHA-512");

        private final String jcaName;

        DigestAlgorithm(String jcaName) {
            this.jcaName = jcaName;
        }

        /** @return JCA MessageDigest algorithm name. */
        public String getJcaName() { return jcaName; }
    }

    /**
     * Calculates a one-way SHA digest of UTF-8 text.
     * SHA-1 is included for compatibility; plain SHA hashes are not suitable
     * for storing login passwords.
     *
     * @param data input text
     * @param algorithm digest algorithm
     * @return Base64-encoded digest
     * @throws GeneralSecurityException if the digest is unavailable
     */
    public static String hash(String data, DigestAlgorithm algorithm)
            throws GeneralSecurityException {
        Objects.requireNonNull(data, "data");
        Objects.requireNonNull(algorithm, "algorithm");

        byte[] digest = MessageDigest.getInstance(algorithm.getJcaName())
                .digest(data.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(digest);
    }

    /** @return default PBKDF2 iteration count for UI initialization. */
    public static int getDefaultIterations() {
        return DEFAULT_ITERATIONS;
    }

    /**
     * Lists AES key sizes permitted by the active JVM/provider for the selected KDF.
     *
     * @param algorithm selected KDF
     * @return immutable supported key lengths in bits
     * @throws GeneralSecurityException if the provider cannot resolve the algorithm
     */
    public static List<Integer> supportedKeyLengths(KdfAlgorithm algorithm)
            throws GeneralSecurityException {
        Objects.requireNonNull(algorithm, "algorithm");

        SecretKeyFactory.getInstance(algorithm.getJcaName());
        int max = Cipher.getMaxAllowedKeyLength("AES");

        List<Integer> values = new ArrayList<Integer>();

        for (int bits : algorithm.getConfiguredKeyLengths()) {
            if (bits <= max) {
                values.add(bits);
            }
        }

        return Collections.unmodifiableList(values);
    }

    /** @return a fresh 16-byte random salt encoded as Base64 URL-safe text. */
    public static String generateSalt() {
        byte[] salt = new byte[SALT_BYTES];
        RANDOM.nextBytes(salt);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(salt);
    }

    /**
     * Encrypts text with a newly generated salt and random AES-GCM nonce.
     *
     * @param plaintext text to encrypt
     * @param password password/key-derivation secret
     * @param algorithm PBKDF2 algorithm
     * @param keyLengthBits AES key length, such as 128 or 256
     * @param iterations PBKDF2 iteration count
     * @param creationDate optional authenticated date metadata, or null
     * @return Base64 URL-safe encrypted envelope
     * @throws GeneralSecurityException if cryptographic operations fail
     * @throws IOException if the envelope cannot be written
     */
    public static String encrypt(
            String plaintext,
            char[] password,
            KdfAlgorithm algorithm,
            int keyLengthBits,
            int iterations,
            Date creationDate)
            throws GeneralSecurityException, IOException {

        byte[] salt = new byte[SALT_BYTES];
        RANDOM.nextBytes(salt);

        return encryptUsingSalt(
                plaintext,
                password,
                salt,
                algorithm,
                keyLengthBits,
                iterations,
                creationDate);
    }

    /**
     * Encrypts text using a caller-supplied Base64 salt (for example, the
     * {@code salt_UserName} from the original DBPassword example). The salt is
     * embedded in the envelope, so it is not necessary to store it separately.
     *
     * @param plaintext text to encrypt
     * @param password password/key-derivation secret
     * @param base64Salt caller-supplied Base64 or Base64 URL-safe salt
     * @param algorithm PBKDF2 algorithm
     * @param keyLengthBits AES key length in bits
     * @param iterations PBKDF2 iteration count
     * @param creationDate optional date metadata, or null
     * @return Base64 URL-safe encrypted envelope
     * @throws GeneralSecurityException if cryptographic operations fail
     * @throws IOException if the envelope cannot be written
     */
    public static String encrypt(
            String plaintext,
            char[] password,
            String base64Salt,
            KdfAlgorithm algorithm,
            int keyLengthBits,
            int iterations,
            Date creationDate)
            throws GeneralSecurityException, IOException {

        return encryptUsingSalt(
                plaintext,
                password,
                decodeSalt(base64Salt),
                algorithm,
                keyLengthBits,
                iterations,
                creationDate);
    }

    /**
     * Decrypts an envelope created by this class. Salt, algorithm, nonce, and
     * iteration count are read from the envelope.
     *
     * @param encodedEnvelope Base64 URL-safe encrypted envelope
     * @param password same password/key-derivation secret used for encryption
     * @return decrypted UTF-8 text
     * @throws GeneralSecurityException for wrong password, tampering, or crypto errors
     * @throws IOException if the envelope is malformed or truncated
     */
    public static String decrypt(String encodedEnvelope, char[] password)
            throws GeneralSecurityException, IOException {

        Envelope e = parse(decodeEnvelope(encodedEnvelope));

        validate(
                password,
                e.algorithm,
                e.keyLengthBits,
                e.iterations);

        byte[] key = derive(
                password,
                e.salt,
                e.algorithm,
                e.iterations,
                e.keyLengthBits);

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

            cipher.init(
                    Cipher.DECRYPT_MODE,
                    new SecretKeySpec(key, "AES"),
                    new GCMParameterSpec(TAG_BITS, e.nonce));

            cipher.updateAAD(e.header);

            return new String(
                    cipher.doFinal(e.ciphertext),
                    StandardCharsets.UTF_8);

        } finally {
            Arrays.fill(key, (byte) 0);
        }
    }

    /**
     * Decrypts while also checking the salt and optional date supplied separately
     * by a caller using the old calling pattern. A non-null expected date must match.
     *
     * @param encodedEnvelope encrypted envelope
     * @param password key-derivation secret
     * @param expectedBase64Salt expected salt, or null to skip salt comparison
     * @param expectedDate expected date, or null to skip date comparison
     * @return decrypted UTF-8 text
     * @throws GeneralSecurityException if authentication/decryption fails
     * @throws IOException if the envelope is malformed
     */
    public static String decrypt(
            String encodedEnvelope,
            char[] password,
            String expectedBase64Salt,
            Date expectedDate)
            throws GeneralSecurityException, IOException {

        Envelope e = parse(decodeEnvelope(encodedEnvelope));

        if (expectedBase64Salt != null
                && !Arrays.equals(decodeSalt(expectedBase64Salt), e.salt)) {
            throw new IllegalArgumentException(
                    "Supplied salt does not match encrypted envelope.");
        }

        if (expectedDate != null
                && expectedDate.getTime() != e.creationTime) {
            throw new IllegalArgumentException(
                    "Supplied date does not match encrypted envelope.");
        }

        return decrypt(encodedEnvelope, password);
    }

    /** @return stored date, or null if encryption was performed without a date. */
    public static Date readCreationDate(String encodedEnvelope)
            throws IOException {

        long time = parse(decodeEnvelope(encodedEnvelope)).creationTime;

        return time == NO_DATE ? null : new Date(time);
    }

    private static String encryptUsingSalt(
            String plaintext,
            char[] password,
            byte[] salt,
            KdfAlgorithm algorithm,
            int keyLengthBits,
            int iterations,
            Date date)
            throws GeneralSecurityException, IOException {

        Objects.requireNonNull(plaintext, "plaintext");

        validate(password, algorithm, keyLengthBits, iterations);

        if (salt.length < 8 || salt.length > 64) {
            throw new IllegalArgumentException(
                    "Salt must contain between 8 and 64 bytes.");
        }

        byte[] nonce = new byte[NONCE_BYTES];
        RANDOM.nextBytes(nonce);

        long time = date == null ? NO_DATE : date.getTime();

        byte[] header = makeHeader(
                algorithm,
                keyLengthBits,
                iterations,
                salt,
                nonce,
                time);

        byte[] key = derive(
                password,
                salt,
                algorithm,
                iterations,
                keyLengthBits);

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(key, "AES"),
                    new GCMParameterSpec(TAG_BITS, nonce));

            cipher.updateAAD(header);

            byte[] encrypted = cipher.doFinal(
                    plaintext.getBytes(StandardCharsets.UTF_8));

            ByteArrayOutputStream out = new ByteArrayOutputStream();

            out.write(header);
            out.write(encrypted);

            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(out.toByteArray());

        } finally {
            Arrays.fill(key, (byte) 0);
        }
    }

    private static byte[] makeHeader(
            KdfAlgorithm algorithm,
            int keyBits,
            int iterations,
            byte[] salt,
            byte[] nonce,
            long time)
            throws IOException {

        ByteArrayOutputStream bytes = new ByteArrayOutputStream();

        try (DataOutputStream out = new DataOutputStream(bytes)) {
            out.writeInt(MAGIC);
            out.writeByte(VERSION);
            out.writeByte(algorithm.ordinal());
            out.writeInt(keyBits);
            out.writeInt(iterations);
            out.writeByte(salt.length);
            out.writeByte(nonce.length);
            out.writeLong(time);
            out.write(salt);
            out.write(nonce);
        }

        return bytes.toByteArray();
    }

    private static Envelope parse(byte[] bytes) throws IOException {
        try (DataInputStream in = new DataInputStream(
                new ByteArrayInputStream(bytes))) {

            int magic = in.readInt();
            int version = in.readUnsignedByte();
            int id = in.readUnsignedByte();
            int keyBits = in.readInt();
            int iterations = in.readInt();
            int saltLength = in.readUnsignedByte();
            int nonceLength = in.readUnsignedByte();
            long time = in.readLong();

            if (magic != MAGIC || version != VERSION) {
                throw new IllegalArgumentException(
                        "Unknown envelope format/version.");
            }

            if (id >= KdfAlgorithm.values().length) {
                throw new IllegalArgumentException(
                        "Unsupported KDF identifier.");
            }

            if (saltLength < 8 || saltLength > 64
                    || nonceLength != NONCE_BYTES) {
                throw new IllegalArgumentException(
                        "Invalid salt/nonce length.");
            }

            byte[] salt = new byte[saltLength];
            byte[] nonce = new byte[nonceLength];

            in.readFully(salt);
            in.readFully(nonce);

            int headerLength = 24 + saltLength + nonceLength;

            if (bytes.length < headerLength + 1 + TAG_BITS / 8) {
                throw new IOException("Encrypted value is truncated.");
            }

            return new Envelope(
                    KdfAlgorithm.values()[id],
                    keyBits,
                    iterations,
                    salt,
                    nonce,
                    time,
                    Arrays.copyOfRange(bytes, 0, headerLength),
                    Arrays.copyOfRange(bytes, headerLength, bytes.length));

        } catch (EOFException ex) {
            throw new IOException("Encrypted value is truncated.", ex);
        }
    }

    private static byte[] derive(
            char[] password,
            byte[] salt,
            KdfAlgorithm algorithm,
            int iterations,
            int keyBits)
            throws GeneralSecurityException {

        PBEKeySpec spec = new PBEKeySpec(
                password,
                salt,
                iterations,
                keyBits);

        try {
            return SecretKeyFactory.getInstance(algorithm.getJcaName())
                    .generateSecret(spec)
                    .getEncoded();
        } finally {
            spec.clearPassword();
        }
    }

    private static void validate(
            char[] password,
            KdfAlgorithm algorithm,
            int keyBits,
            int iterations)
            throws GeneralSecurityException {

        Objects.requireNonNull(password, "password");
        Objects.requireNonNull(algorithm, "algorithm");

        if (password.length == 0) {
            throw new IllegalArgumentException("Password must not be empty.");
        }

        if (iterations < 1 || iterations > MAX_ITERATIONS) {
            throw new IllegalArgumentException(
                    "Iterations must be between 1 and "
                            + MAX_ITERATIONS + ".");
        }

        if (!supportedKeyLengths(algorithm).contains(keyBits)) {
            throw new IllegalArgumentException(
                    "Unsupported AES key length: " + keyBits);
        }
    }

    private static byte[] decodeSalt(String value) {
        Objects.requireNonNull(value, "base64Salt");

        try {
            return Base64.getDecoder().decode(value);
        } catch (IllegalArgumentException ex) {
            try {
                return Base64.getUrlDecoder().decode(value);
            } catch (IllegalArgumentException ignored) {
                throw new IllegalArgumentException(
                        "Salt must be valid Base64/Base64 URL-safe text.",
                        ex);
            }
        }
    }

    private static byte[] decodeEnvelope(String value) {
        Objects.requireNonNull(value, "encodedEnvelope");

        try {
            return Base64.getUrlDecoder().decode(value);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid Base64 URL-safe envelope.",
                    ex);
        }
    }

    private static final class Envelope {
        final KdfAlgorithm algorithm;
        final int keyLengthBits;
        final int iterations;
        final byte[] salt;
        final byte[] nonce;
        final long creationTime;
        final byte[] header;
        final byte[] ciphertext;

        Envelope(
                KdfAlgorithm algorithm,
                int keyLengthBits,
                int iterations,
                byte[] salt,
                byte[] nonce,
                long creationTime,
                byte[] header,
                byte[] ciphertext) {

            this.algorithm = algorithm;
            this.keyLengthBits = keyLengthBits;
            this.iterations = iterations;
            this.salt = salt;
            this.nonce = nonce;
            this.creationTime = creationTime;
            this.header = header;
            this.ciphertext = ciphertext;
        }
    }
}
```

## Example 1 — Enum options for the UI

```java
for (PasswordCrypto.KdfAlgorithm option
        : PasswordCrypto.KdfAlgorithm.values()) {
    System.out.println(option.name() + " -> " + option.getJcaName());
}

System.out.println(
        PasswordCrypto.supportedKeyLengths(
                PasswordCrypto.KdfAlgorithm.PBKDF2_HMAC_SHA256));

for (PasswordCrypto.DigestAlgorithm option
        : PasswordCrypto.DigestAlgorithm.values()) {
    System.out.println(option.name() + " -> " + option.getJcaName());
}

System.out.println("Generated salt: " + PasswordCrypto.generateSalt());
```

## Example 2 — Encryption/decryption with date and without date

```java
char[] secret =
        "load-this-secret-from-secure-configuration".toCharArray();

String rawPassword = "Yash@001";

Date creationDate = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")
        .parse("2023-12-29T10:09:34");

// With date, using PBKDF2-HMAC-SHA1 for compatibility.
String encodedWithDate = PasswordCrypto.encrypt(
        rawPassword,
        secret,
        PasswordCrypto.KdfAlgorithm.PBKDF2_HMAC_SHA1,
        128,
        PasswordCrypto.getDefaultIterations(),
        creationDate);

String decodedWithDate =
        PasswordCrypto.decrypt(encodedWithDate, secret);

System.out.println(decodedWithDate);
System.out.println(PasswordCrypto.readCreationDate(encodedWithDate));

// Without date, using PBKDF2-HMAC-SHA256.
String encodedWithoutDate = PasswordCrypto.encrypt(
        rawPassword,
        secret,
        PasswordCrypto.KdfAlgorithm.PBKDF2_HMAC_SHA256,
        256,
        PasswordCrypto.getDefaultIterations(),
        null);

String decodedWithoutDate =
        PasswordCrypto.decrypt(encodedWithoutDate, secret);

System.out.println(decodedWithoutDate);
System.out.println(
        PasswordCrypto.readCreationDate(encodedWithoutDate)); // null

Arrays.fill(secret, '\0');
```

## Example 3 — Same salt/date-style properties as the original `DBPassword` example

The original example has `raw_Password`, `salt_UserName`, and `dateFrom`. The following overload accepts the existing Base64 salt and optional date. The encryption secret is the PBKDF2 password; it is distinct from the plaintext being encrypted.

```java
String salt_UserName = "RxY+5mVWgC1exzqDrJKLdLLjU+4FdvL6";
String raw_Password = "Yash@001";

char[] encryptionSecret =
        "load-the-real-secret-from-secure-configuration".toCharArray();

Date dateFrom = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")
        .parse("2023-12-29T10:09:34");

// Same supplied salt + date.
String encodeWithDate = PasswordCrypto.encrypt(
        raw_Password,
        encryptionSecret,
        salt_UserName,
        PasswordCrypto.KdfAlgorithm.PBKDF2_HMAC_SHA1,
        128,
        PasswordCrypto.getDefaultIterations(),
        dateFrom);

String decodedWithDate = PasswordCrypto.decrypt(
        encodeWithDate,
        encryptionSecret,
        salt_UserName,
        dateFrom);

System.out.println("Encoded with date: " + encodeWithDate);
System.out.println("Decoded with date: " + decodedWithDate);

// Same supplied salt, no date.
String encodeWithoutDate = PasswordCrypto.encrypt(
        raw_Password,
        encryptionSecret,
        salt_UserName,
        PasswordCrypto.KdfAlgorithm.PBKDF2_HMAC_SHA256,
        256,
        PasswordCrypto.getDefaultIterations(),
        null);

String decodedWithoutDate = PasswordCrypto.decrypt(
        encodeWithoutDate,
        encryptionSecret,
        salt_UserName,
        null);

System.out.println("Encoded without date: " + encodeWithoutDate);
System.out.println("Decoded without date: " + decodedWithoutDate);

Arrays.fill(encryptionSecret, '\0');
```

## Example 4 — SHA-1 / SHA-256 / SHA-512 digest

```java
String data = "Yash@001";

System.out.println(
        PasswordCrypto.hash(data, PasswordCrypto.DigestAlgorithm.SHA1));

System.out.println(
        PasswordCrypto.hash(data, PasswordCrypto.DigestAlgorithm.SHA256));

System.out.println(
        PasswordCrypto.hash(data, PasswordCrypto.DigestAlgorithm.SHA512));
```

The `hash` operation supports empty strings, but rejects `null`. There is no `decrypt()` for SHA digests because hashing is one-way.

## UI field mapping

| UI control | API | Notes |
|---|---|---|
| Operation | Encrypt / Decrypt / Hash | Hash is one-way |
| KDF dropdown | `KdfAlgorithm.values()` | SHA1, SHA256, SHA512 PBKDF2 variants |
| Digest dropdown | `DigestAlgorithm.values()` | SHA1, SHA256, SHA512 message digests |
| AES key length | `supportedKeyLengths(selectedKdf)` | Runtime-filtered 128 / 192 / 256-bit options |
| Iterations | `getDefaultIterations()` | Benchmark for your server |
| Salt | `generateSalt()` or supplied Base64 salt overload | Salt is embedded in the envelope |
| Date | `Date` or `null` | Authenticated metadata, not a nonce |
| Output | Base64 URL-safe envelope or digest | Persist the complete envelope for decryption |

## Security and compatibility notes

1. Prefer PBKDF2-HMAC-SHA256 or PBKDF2-HMAC-SHA512 for new configurations. PBKDF2-HMAC-SHA1 is included for compatibility with existing examples.
2. SHA-1/SHA-256/SHA-512 digests cannot be decrypted. Plain SHA digests are not appropriate for password storage.
3. A fresh random AES-GCM nonce is generated for each encryption; do not derive the nonce from a date.
4. Never hard-code or log the encryption secret. Load it from a secret manager or secure runtime configuration.
5. The old example uses AES-CBC and a date-derived IV, so its ciphertext is not compatible with this AES-GCM envelope. Keep a separate legacy decoder and migrate deliberately if existing database values must remain readable.
6. For login passwords, use a dedicated password-hashing scheme and verify hashes; do not store reversible encrypted passwords.
7. The default 600,000 PBKDF2 iterations is a starting point. Benchmark on the target JVM and follow current security guidance.