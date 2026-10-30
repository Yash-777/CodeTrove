# Java Cryptography Utility (SHA-1 / SHA-256 / SHA-512)

This Java 8+ implementation supports enum-driven UI options, runtime-checked AES key lengths, generated or caller-supplied Base64 salt, optional creation-date metadata, reversible encryption/decryption, and SHA digests.

## Important distinction

- **SHA-1, SHA-256, and SHA-512 digests are one-way.** They cannot be decrypted. Use `hash(...)` only when a digest is what you need.
- Reversible encryption uses **AES-GCM**. The selected `KdfAlgorithm` determines whether PBKDF2 uses HMAC-SHA1, HMAC-SHA256, or HMAC-SHA512 to derive the AES key.
- Optional date metadata is authenticated and stored in the envelope; it is **not** used as the AES IV/nonce.
- This version uses a new envelope format and cannot decrypt the old `AES/CBC/PKCS5Padding` values directly.

<details><summary><ul><code>PasswordCrypto.java</code>
  <li><b>Header Configuration (AES-GCM):</b> Recommended for encrypting new values using the header-based configuration.</li>
  <li><b>Legacy Mode (AES-CBC):</b> Maintains backward compatibility and reproduces the same encrypted output when the same date and configuration are supplied.</li>
</ul></summary>

```java runnable
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.AlgorithmParameters;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
/**
 * Supports legacy-compatible AES-CBC encryption and a separate
 * self-describing AES-GCM envelope.
 *
 * <p>Legacy mode must retain the original algorithm parameters and byte
 * layout when compatibility with existing database values is required.</p>
 *
 * <p>Header mode stores its KDF parameters and cryptographic metadata
 * in the encrypted envelope so that decryption can read them automatically.</p>
 */
public final class PasswordCrypto {
  public static Date getDateFrom(String creationDate) {
    String dateFormat = "yyyy-MM-dd'T'HH:mm:ss";
    SimpleDateFormat sdf = new SimpleDateFormat(dateFormat);
    try {
      return sdf.parse(creationDate);
    } catch (ParseException e) {
      e.printStackTrace();
      return new Date(); // Return the current date if parsing fails
    }
  }
  public static void main(String[] args) throws Exception {
    String secret128 = PasswordCrypto.generateEncryptionSecret(128);
    System.out.println("128-bit-sized secret: " + secret128);

    String secret192 = PasswordCrypto.generateEncryptionSecret(192);
    System.out.println("192-bit-sized secret: " + secret192);

    String secret256 = PasswordCrypto.generateEncryptionSecret(256);
    System.out.println("256-bit-sized secret: " + secret256);
	
	// Legacy encryption test
    String encryptionSec128 = "YWRtaW5AZHNwcm8uY29tMjAyMy0xMi0yOVQxMDowOUujxOjQ6K8UZpQ76Mgpd6Y=";
                             // PasswordCrypto.generateEncryptionSecret(128);
    System.out.println("encryptionSec128:" + encryptionSec128);
	
    String salt_UserName = "Yash";
    String raw_Password = "Yash@007";
    Date dateFrom = getDateFrom("2023-12-29T10:09:02"); // Hours and minutes are considered not seconds
	
	// Legacy mode with supplied date - (Same output)
    legacyTest(encryptionSec128, raw_Password, salt_UserName, dateFrom);
    // Legacy mode without supplied date (current-date behavior)
    legacyTest(encryptionSec128, raw_Password, salt_UserName, null);
	
    // Header-based encryption — output intentionally differs
    String encryptionSec256 = "vzQbXsDk6GSjrmWqGg3ROWbT8z8TMKlXxBOqp3rhsf0";
                              // PasswordCrypto.generateEncryptionSecret(256);
    System.out.println("encryptionSec256:" + encryptionSec256);
    String rawPassword = "Yash@001";
    Date createdDate = getDateFrom("2023-12-29T10:09:34");
	
	// Header-based encryption with supplied date
    headerBased(encryptionSec256, rawPassword, createdDate);
	// Header-based encryption without supplied date
    headerBased(encryptionSec256, rawPassword, null);
  }
  private static void headerBased(String encryptionSec256, String rawPassword, Date createdDate)
      throws Exception, IOException {
    char[] encryptionSecret = encryptionSec256.toCharArray();
    String encoded = PasswordCrypto.encryptWithHeader(rawPassword, encryptionSecret,
        PasswordCrypto.KdfAlgorithm.PBKDF2_HMAC_SHA256, 256, 600000, createdDate);
    String decoded = PasswordCrypto.decryptWithHeader(encoded, encryptionSecret);
    System.out.println("Header-based encryption - Encoded: " + encoded);
    System.out.println("Header-based encryption - Decoded: " + decoded);
    System.out.println("Stored date: " + PasswordCrypto.readHeaderDate(encoded));
    Arrays.fill(encryptionSecret, '\0');
  }
  private static void legacyTest(String encryptionSec, String raw_Password, String salt_UserName, Date dateFrom) throws Exception {
    // Load the exact existing secret securely.
    char[] encryptionSecret = encryptionSec.toCharArray();
    //"load-the-real-secret-from-secure-configuration".toCharArray();
    
    KdfAlgorithm algorithm = KdfAlgorithm.PBKDF2_HMAC_SHA1;
    int iterations = PasswordCrypto.LegacyConfig.ITERATIONS;
    int keyLengthBits = PasswordCrypto.LegacyConfig.KEY_LENGTH_BITS;
	
    String encodeWithDate = PasswordCrypto.encryptLegacy(raw_Password, salt_UserName, dateFrom,
        encryptionSecret, algorithm, iterations, keyLengthBits);
    System.out.println("Encoded [" + encodeWithDate + "] with Date:" + dateFrom);
	
    String decodedWithDate = PasswordCrypto.decryptLegacy(
        encodeWithDate, salt_UserName, encryptionSecret, algorithm, iterations, keyLengthBits);
    System.out.println("Decoded [" + decodedWithDate + "] with Date:" + dateFrom);
  }
  private PasswordCrypto() {}
  private static final SecureRandom RANDOM = new SecureRandom();
  // ---------------------------------------------------------------------
  // LEGACY CONFIGURATION
  // ---------------------------------------------------------------------
  public static final class LegacyConfig {
    private LegacyConfig() {}
    public static final int SALT_SIZE = 24;
    public static final int ITERATIONS = 1024;
    public static final int KEY_LENGTH_BITS = 128;
    public static final String KDF_ALGORITHM = "PBKDF2WithHmacSHA1";
    public static final String CIPHER_ALGORITHM = "AES";
    public static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    public static final String DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
  }
  // ---------------------------------------------------------------------
  // HEADER CONFIGURATION
  // ---------------------------------------------------------------------
  public static final class HeaderConfig {
    private HeaderConfig() {}
    public static final int ITERATIONS = 600_000;
    public static final int KEY_LENGTH_BITS = 256;
    public static final KdfAlgorithm KDF_ALGORITHM = KdfAlgorithm.PBKDF2_HMAC_SHA256;
  }
  // ---------------------------------------------------------------------
  // ENUMS
  // ---------------------------------------------------------------------
  /**
   * Supported PBKDF2 algorithms.
   */
  public enum KdfAlgorithm {
    PBKDF2_HMAC_SHA1("PBKDF2WithHmacSHA1"),
    PBKDF2_HMAC_SHA256("PBKDF2WithHmacSHA256"),
    PBKDF2_HMAC_SHA512("PBKDF2WithHmacSHA512");
    private final String jcaName;
    KdfAlgorithm(String jcaName) {
      this.jcaName = jcaName;
    }
    public String getJcaName() {
      return jcaName;
    }
  }
  /**
   * One-way digest algorithms.
   *
   * SHA digests cannot be decrypted.
   */
  public enum DigestAlgorithm {
    SHA1("SHA-1"),
    SHA256("SHA-256"),
    SHA512("SHA-512");
    private final String jcaName;
    DigestAlgorithm(String jcaName) {
      this.jcaName = jcaName;
    }
    public String getJcaName() {
      return jcaName;
    }
  }
  // ---------------------------------------------------------------------
  // KEY LENGTH SUPPORT
  // ---------------------------------------------------------------------
  /**
   * Returns AES key lengths permitted by the current JVM.
   *
   * @return supported AES key lengths in bits
   * @throws GeneralSecurityException if AES is unavailable
   */
  public static List<Integer> supportedKeyLengths() throws GeneralSecurityException {
    int maximum = Cipher.getMaxAllowedKeyLength("AES");
    List<Integer> lengths = new ArrayList<Integer>();
    if (maximum >= 128) {
      lengths.add(128);
    }
    if (maximum >= 192) {
      lengths.add(192);
    }
    if (maximum >= 256) {
      lengths.add(256);
    }
    return Collections.unmodifiableList(lengths);
  }
  // ---------------------------------------------------------------------
  // ENCRYPTION SECRET GENERATION
  // ---------------------------------------------------------------------
  /**
   * Generates a random encryption secret using the selected AES key length
   * as the number of random bits.
   *
   * <p>The result is a Base64 URL-safe string intended to be used as
   * the password input to PBKDF2. It is not the derived AES key itself.</p>
   *
   * <p>Store the generated secret securely. A different secret will not
   * decrypt existing values.</p>
   *
   * @param keyLengthBits 128, 192, or 256
   * @return generated encryption secret
   * @throws GeneralSecurityException if the key length is unsupported
   */
  public static String generateEncryptionSecret(int keyLengthBits) throws GeneralSecurityException {
    if (!supportedKeyLengths().contains(keyLengthBits)) {
      throw new IllegalArgumentException("Unsupported AES key length: " + keyLengthBits);
    }
    byte[] randomBytes = new byte[keyLengthBits / 8];
    RANDOM.nextBytes(randomBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
  }
  // ---------------------------------------------------------------------
  // SALT HELPERS
  // ---------------------------------------------------------------------
  /**
   * Generates a random salt.
   *
   * @param saltSize number of random bytes
   * @return standard Base64-encoded salt
   */
  public static String generateSalt(int saltSize) {
    if (saltSize < 8 || saltSize > 64) {
      throw new IllegalArgumentException("Salt size must be between 8 and 64 bytes.");
    }
    byte[] salt = new byte[saltSize];
    RANDOM.nextBytes(salt);
    return Base64.getEncoder().encodeToString(salt);
  }
  /**
   * Encodes bytes as standard Base64.
   *
   * @param value bytes to encode
   * @return encoded string
   */
  public static String encodeSalt(byte[] value) {
    Objects.requireNonNull(value, "value");
    return Base64.getEncoder().encodeToString(value);
  }
  /**
   * Decodes a salt using the same fallback behavior as the original
   * DBPassword.java implementation.
   *
   * <p>First attempts standard Base64, then Base64 URL-safe encoding,
   * then falls back to the platform-default byte representation of
   * the original string.</p>
   *
   * <p>The final fallback is retained for legacy compatibility. New
   * applications should validate salt encoding explicitly.</p>
   *
   * @param value supplied salt
   * @return decoded salt bytes
   */
  private static byte[] decodeSalt(String value) {
    Objects.requireNonNull(value, "base64Salt");
    try {
      return Base64.getDecoder().decode(value);
    } catch (IllegalArgumentException ex) {
      try {
        return Base64.getUrlDecoder().decode(value);
      } catch (IllegalArgumentException ignored) {
        return value.getBytes();
      }
    }
  }
  // =====================================================================
  // 1. LEGACY-COMPATIBLE ENCRYPTION
  // =====================================================================
  /**
   * Encrypts using the original DBPassword.java format.
   *
   * <p>Output layout:</p>
   *
   * <pre>
   * Base64(saltBytes + ivBytes + encryptedTextBytes)
   * </pre>
   *
   * <p>If createdDate is null, the current date is used to derive the IV,
   * matching the original behavior.</p>
   *
   * <p>To reproduce the original encryption result, use:</p>
   *
   * <ul>
   *   <li>PBKDF2WithHmacSHA1</li>
   *   <li>1024 iterations</li>
   *   <li>128-bit AES key</li>
   *   <li>AES/CBC/PKCS5Padding</li>
   *   <li>The original encryption secret</li>
   *   <li>The same salt and date</li>
   * </ul>
   *
   * @param rawPass plaintext to encrypt
   * @param salt supplied salt
   * @param createdDate date used for IV generation, or null for current date
   * @param encryptionSecret original PBKDF2 password
   * @param algorithm PBKDF2 algorithm
   * @param iterations PBKDF2 iterations
   * @param keyLengthBits derived AES key length
   * @return standard Base64 encrypted value
   * @throws Exception if encryption fails
   */
  public static String encryptLegacy(String rawPass, String salt, Date createdDate,
      char[] encryptionSecret, KdfAlgorithm algorithm, int iterations, int keyLengthBits)
      throws Exception {
    Objects.requireNonNull(rawPass, "rawPass");
    Objects.requireNonNull(encryptionSecret, "encryptionSecret");
    Objects.requireNonNull(algorithm, "algorithm");
    byte[] saltBytes = decodeSalt(salt);
    SecretKey secretKey = generateSecretKey(
        algorithm.getJcaName(), encryptionSecret, saltBytes, iterations, keyLengthBits);
    SecretKeySpec secret = new SecretKeySpec(secretKey.getEncoded(), LegacyConfig.CIPHER_ALGORITHM);
    Cipher cipher = Cipher.getInstance(LegacyConfig.TRANSFORMATION);
    Date effectiveDate = createdDate != null ? createdDate : new Date();
    IvParameterSpec ivSpec = generateIvParameterSpec(effectiveDate);
    cipher.init(Cipher.ENCRYPT_MODE, secret, ivSpec);
    byte[] encryptedTextBytes = cipher.doFinal(rawPass.getBytes(StandardCharsets.UTF_8));
    return encodeLegacyResult(saltBytes, cipher.getParameters(), encryptedTextBytes);
  }
  /**
   * Decrypts the original DBPassword.java output format.
   *
   * <p>The caller must supply the same encryption secret, KDF algorithm,
   * iteration count, and AES key length used during encryption.</p>
   *
   * <p>The IV is read from the encrypted value. The createdDate argument
   * is not needed for decryption because the IV is already included.</p>
   *
   * @param encryptedText legacy Base64 value
   * @param salt original supplied salt
   * @param encryptionSecret original PBKDF2 password
   * @param algorithm PBKDF2 algorithm
   * @param iterations PBKDF2 iterations
   * @param keyLengthBits AES key length
   * @return decrypted plaintext
   * @throws Exception if decryption fails
   */
  public static String decryptLegacy(String encryptedText, String salt, char[] encryptionSecret,
      KdfAlgorithm algorithm, int iterations, int keyLengthBits) throws Exception {
    Objects.requireNonNull(encryptedText, "encryptedText");
    Objects.requireNonNull(encryptionSecret, "encryptionSecret");
    byte[] saltBytes = decodeSalt(salt);
    SecretKey secretKey = generateSecretKey(
        algorithm.getJcaName(), encryptionSecret, saltBytes, iterations, keyLengthBits);
    Cipher cipher = Cipher.getInstance(LegacyConfig.TRANSFORMATION);
    ByteBuffer buffer = ByteBuffer.wrap(Base64.getDecoder().decode(encryptedText));
    if (buffer.remaining() < saltBytes.length + cipher.getBlockSize() + 1) {
      throw new IllegalArgumentException("Invalid or truncated legacy encrypted value.");
    }
    // Retain the original envelope layout: salt + IV + ciphertext.
    byte[] embeddedSalt = new byte[saltBytes.length];
    buffer.get(embeddedSalt);
    byte[] ivBytes = new byte[cipher.getBlockSize()];
    buffer.get(ivBytes);
    byte[] encryptedTextBytes = new byte[buffer.remaining()];
    buffer.get(encryptedTextBytes);
    SecretKeySpec secret = new SecretKeySpec(secretKey.getEncoded(), LegacyConfig.CIPHER_ALGORITHM);
    cipher.init(Cipher.DECRYPT_MODE, secret, new IvParameterSpec(ivBytes));
    byte[] decryptedTextBytes = cipher.doFinal(encryptedTextBytes);
    return new String(decryptedTextBytes, StandardCharsets.UTF_8);
  }
  /**
   * Reproduces the original date-to-IV logic.
   *
   * <p>The date is formatted as yyyy-MM-dd'T'HH:mm:ss. The UTF-8 bytes
   * are copied into a 16-byte array, with remaining bytes set to zero.</p>
   *
   * <p>Do not replace this implementation if exact legacy compatibility
   * is required.</p>
   */
  private static IvParameterSpec generateIvParameterSpec(Date createdDate) {
    String ivStrDate = getStringFrom(createdDate);
    byte[] ivBytes = new byte[16];
    byte[] ivSource = ivStrDate.getBytes(StandardCharsets.UTF_8);
    System.arraycopy(ivSource, 0, ivBytes, 0, Math.min(ivSource.length, ivBytes.length));
    return new IvParameterSpec(ivBytes);
  }
  /**
   * Converts a Date using the original format.
   *
   * <p>SimpleDateFormat uses the JVM's default time zone, as in the
   * original implementation. Keep the same time zone for reproducibility.</p>
   */
  public static String getStringFrom(Date date) {
    SimpleDateFormat sdf = new SimpleDateFormat(LegacyConfig.DATE_FORMAT);
    return sdf.format(date);
  }
  /**
   * Encodes the original legacy output.
   *
   * <p>Output is standard Base64, not URL-safe Base64.</p>
   */
  private static String encodeLegacyResult(
      byte[] saltBytes, AlgorithmParameters params, byte[] encryptedTextBytes) {
    byte[] ivBytes;
    try {
      ivBytes = params.getParameterSpec(IvParameterSpec.class).getIV();
    } catch (Exception ex) {
      ivBytes = new byte[16];
    }
    byte[] buffer = new byte[saltBytes.length + ivBytes.length + encryptedTextBytes.length];
    System.arraycopy(saltBytes, 0, buffer, 0, saltBytes.length);
    System.arraycopy(ivBytes, 0, buffer, saltBytes.length, ivBytes.length);
    System.arraycopy(encryptedTextBytes, 0, buffer, saltBytes.length + ivBytes.length,
        encryptedTextBytes.length);
    return Base64.getEncoder().encodeToString(buffer);
  }
  // =====================================================================
  // 2. HEADER-BASED ENCRYPTION
  // =====================================================================
  private static final int HEADER_MAGIC = 0x43545256; // CTRV
  private static final byte HEADER_VERSION = 1;
  private static final int GCM_NONCE_BYTES = 12;
  private static final int GCM_TAG_BITS = 128;
  private static final long NO_DATE = Long.MIN_VALUE;
  /**
   * Encrypts using the new header-based format.
   *
   * <p>Unlike legacy mode, this format uses AES-GCM and a random nonce.
   * The KDF algorithm, key length, iteration count, salt, nonce, and
   * optional date metadata are stored in the envelope.</p>
   *
   * <p>For each call, use a unique salt and random nonce. Reusing the
   * same salt is not recommended for new encryption records.</p>
   *
   * @param plaintext text to encrypt
   * @param encryptionSecret PBKDF2 password
   * @param algorithm selected PBKDF2 algorithm
   * @param keyLengthBits AES key length
   * @param iterations PBKDF2 iteration count
   * @param createdDate optional date metadata
   * @return standard Base64 envelope
   * @throws Exception if encryption fails
   */
  public static String encryptWithHeader(String plaintext, char[] encryptionSecret,
      KdfAlgorithm algorithm, int keyLengthBits, int iterations, Date createdDate)
      throws Exception {
    byte[] salt = new byte[LegacyConfig.SALT_SIZE];
    RANDOM.nextBytes(salt);
    return encryptHeaderUsingSalt(
        plaintext, encryptionSecret, salt, algorithm, keyLengthBits, iterations, createdDate);
  }
  /**
   * Header encryption using a caller-provided salt.
   */
  public static String encryptWithHeader(String plaintext, String base64Salt,
      char[] encryptionSecret, KdfAlgorithm algorithm, int keyLengthBits, int iterations,
      Date createdDate) throws Exception {
    return encryptHeaderUsingSalt(plaintext, encryptionSecret, decodeSalt(base64Salt), algorithm,
        keyLengthBits, iterations, createdDate);
  }
  private static String encryptHeaderUsingSalt(String plaintext, char[] encryptionSecret,
      byte[] salt, KdfAlgorithm algorithm, int keyLengthBits, int iterations, Date createdDate)
      throws Exception {
    Objects.requireNonNull(plaintext, "plaintext");
    Objects.requireNonNull(encryptionSecret, "encryptionSecret");
    Objects.requireNonNull(algorithm, "algorithm");
    validateParameters(encryptionSecret, algorithm, keyLengthBits, iterations);
    if (salt.length < 8 || salt.length > 64) {
      throw new IllegalArgumentException("Salt must contain between 8 and 64 bytes.");
    }
    byte[] nonce = new byte[GCM_NONCE_BYTES];
    RANDOM.nextBytes(nonce);
    long dateMillis = createdDate == null ? NO_DATE : createdDate.getTime();
    byte[] header = createHeader(algorithm, keyLengthBits, iterations, salt, nonce, dateMillis);
    byte[] derivedKey = deriveKey(encryptionSecret, salt, algorithm, iterations, keyLengthBits);
    try {
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(derivedKey, "AES"),
          new GCMParameterSpec(GCM_TAG_BITS, nonce));
      // Authenticate the header; changing metadata invalidates the tag.
      cipher.updateAAD(header);
      byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
      ByteArrayOutputStream output = new ByteArrayOutputStream();
      output.write(header);
      output.write(ciphertext);
      return Base64.getEncoder().encodeToString(output.toByteArray());
    } finally {
      Arrays.fill(derivedKey, (byte) 0);
    }
  }
  /**
   * Decrypts a header-based envelope by reading the KDF and AES settings
   * from its header.
   */
  public static String decryptWithHeader(String encryptedEnvelope, char[] encryptionSecret)
      throws Exception {
    HeaderEnvelope envelope = parseHeader(encryptedEnvelope);
    return decryptHeaderEnvelope(envelope, encryptionSecret);
  }
  /**
   * Decrypts a header-based envelope and validates the expected parameters.
   *
   * <p>This overload is useful when the application requires a specific
   * algorithm, key length, and iteration count.</p>
   */
  public static String decryptWithHeader(String encryptedEnvelope, char[] encryptionSecret,
      KdfAlgorithm expectedAlgorithm, int expectedKeyLengthBits, int expectedIterations)
      throws Exception {
    HeaderEnvelope envelope = parseHeader(encryptedEnvelope);
    if (envelope.algorithm != expectedAlgorithm) {
      throw new IllegalArgumentException("KDF algorithm does not match the expected value.");
    }
    if (envelope.keyLengthBits != expectedKeyLengthBits) {
      throw new IllegalArgumentException("AES key length does not match the expected value.");
    }
    if (envelope.iterations != expectedIterations) {
      throw new IllegalArgumentException("Iteration count does not match the expected value.");
    }
    return decryptHeaderEnvelope(envelope, encryptionSecret);
  }
  /**
   * Returns the optional date stored in a header envelope.
   *
   * @return stored date, or null if no date was supplied
   */
  public static Date readHeaderDate(String encryptedEnvelope) throws IOException {
    HeaderEnvelope envelope = parseHeader(encryptedEnvelope);
    return envelope.dateMillis == NO_DATE ? null : new Date(envelope.dateMillis);
  }
  private static String decryptHeaderEnvelope(HeaderEnvelope envelope, char[] encryptionSecret)
      throws Exception {
    validateParameters(
        encryptionSecret, envelope.algorithm, envelope.keyLengthBits, envelope.iterations);
    byte[] derivedKey = deriveKey(encryptionSecret, envelope.salt, envelope.algorithm,
        envelope.iterations, envelope.keyLengthBits);
    try {
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(derivedKey, "AES"),
          new GCMParameterSpec(GCM_TAG_BITS, envelope.nonce));
      cipher.updateAAD(envelope.header);
      byte[] plaintext = cipher.doFinal(envelope.ciphertext);
      return new String(plaintext, StandardCharsets.UTF_8);
    } finally {
      Arrays.fill(derivedKey, (byte) 0);
    }
  }
  private static byte[] createHeader(KdfAlgorithm algorithm, int keyLengthBits, int iterations,
      byte[] salt, byte[] nonce, long dateMillis) throws IOException {
    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
    try (DataOutputStream out = new DataOutputStream(bytes)) {
      out.writeInt(HEADER_MAGIC);
      out.writeByte(HEADER_VERSION);
      out.writeByte(algorithm.ordinal());
      out.writeInt(keyLengthBits);
      out.writeInt(iterations);
      out.writeByte(salt.length);
      out.writeByte(nonce.length);
      out.writeLong(dateMillis);
      out.write(salt);
      out.write(nonce);
    }
    return bytes.toByteArray();
  }
  private static HeaderEnvelope parseHeader(String encryptedEnvelope) throws IOException {
    Objects.requireNonNull(encryptedEnvelope, "encryptedEnvelope");
    byte[] bytes;
    try {
      bytes = Base64.getDecoder().decode(encryptedEnvelope);
    } catch (IllegalArgumentException ex) {
      throw new IllegalArgumentException("Invalid Base64 header envelope.", ex);
    }
    try (DataInputStream in = new DataInputStream(new ByteArrayInputStream(bytes))) {
      int magic = in.readInt();
      int version = in.readUnsignedByte();
      int algorithmId = in.readUnsignedByte();
      int keyLengthBits = in.readInt();
      int iterations = in.readInt();
      int saltLength = in.readUnsignedByte();
      int nonceLength = in.readUnsignedByte();
      long dateMillis = in.readLong();
      if (magic != HEADER_MAGIC || version != HEADER_VERSION) {
        throw new IllegalArgumentException("Unknown encrypted-envelope format.");
      }
      if (algorithmId >= KdfAlgorithm.values().length) {
        throw new IllegalArgumentException("Unsupported KDF algorithm identifier.");
      }
      if (saltLength < 8 || saltLength > 64 || nonceLength != GCM_NONCE_BYTES) {
        throw new IllegalArgumentException("Invalid salt or nonce length.");
      }
      byte[] salt = new byte[saltLength];
      byte[] nonce = new byte[nonceLength];
      in.readFully(salt);
      in.readFully(nonce);
      int headerLength = 24 + saltLength + nonceLength;
      if (bytes.length < headerLength + 16) {
        throw new IOException("Encrypted envelope is truncated.");
      }
      byte[] header = Arrays.copyOfRange(bytes, 0, headerLength);
      byte[] ciphertext = Arrays.copyOfRange(bytes, headerLength, bytes.length);
      return new HeaderEnvelope(KdfAlgorithm.values()[algorithmId], keyLengthBits, iterations, salt,
          nonce, dateMillis, header, ciphertext);
    } catch (EOFException ex) {
      throw new IOException("Encrypted envelope is truncated.", ex);
    }
  }
  // =====================================================================
  // SHARED KEY DERIVATION AND VALIDATION
  // =====================================================================
  private static SecretKey generateSecretKey(String algorithm, char[] password, byte[] salt,
      int iterations, int keyLengthBits) throws Exception {
    validateKeyLength(keyLengthBits);
    PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, keyLengthBits);
    try {
      SecretKeyFactory factory = SecretKeyFactory.getInstance(algorithm);
      return factory.generateSecret(spec);
    } finally {
      spec.clearPassword();
    }
  }
  private static byte[] deriveKey(char[] password, byte[] salt, KdfAlgorithm algorithm,
      int iterations, int keyLengthBits) throws Exception {
    SecretKey key =
        generateSecretKey(algorithm.getJcaName(), password, salt, iterations, keyLengthBits);
    return key.getEncoded();
  }
  private static void validateParameters(char[] encryptionSecret, KdfAlgorithm algorithm,
      int keyLengthBits, int iterations) throws Exception {
    Objects.requireNonNull(encryptionSecret, "encryptionSecret");
    Objects.requireNonNull(algorithm, "algorithm");
    if (encryptionSecret.length == 0) {
      throw new IllegalArgumentException("Encryption secret must not be empty.");
    }
    validateKeyLength(keyLengthBits);
    if (iterations < 1 || iterations > 10_000_000) {
      throw new IllegalArgumentException("Iterations must be between 1 and 10000000.");
    }
    SecretKeyFactory.getInstance(algorithm.getJcaName());
  }
  private static void validateKeyLength(int keyLengthBits) throws GeneralSecurityException {
    if (!supportedKeyLengths().contains(keyLengthBits)) {
      throw new IllegalArgumentException("Unsupported AES key length: " + keyLengthBits);
    }
  }
  // =====================================================================
  // HEADER DATA MODEL
  // =====================================================================
  private static final class HeaderEnvelope {
    final KdfAlgorithm algorithm;
    final int keyLengthBits;
    final int iterations;
    final byte[] salt;
    final byte[] nonce;
    final long dateMillis;
    final byte[] header;
    final byte[] ciphertext;
    HeaderEnvelope(KdfAlgorithm algorithm, int keyLengthBits, int iterations, byte[] salt,
        byte[] nonce, long dateMillis, byte[] header, byte[] ciphertext) {
      this.algorithm = algorithm;
      this.keyLengthBits = keyLengthBits;
      this.iterations = iterations;
      this.salt = salt;
      this.nonce = nonce;
      this.dateMillis = dateMillis;
      this.header = header;
      this.ciphertext = ciphertext;
    }
  }
}
```

</details>

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