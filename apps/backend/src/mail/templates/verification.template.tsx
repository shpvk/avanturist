import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
} from '@react-email/components';

interface VerificationEmailProps {
    link: string;
}

export function VerificationEmail({ link }: VerificationEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Подтвердите почту в BuildVerdict</Preview>
            <Body style={{ backgroundColor: '#111827', fontFamily: 'Arial, sans-serif' }}>
                <Container style={{ padding: '32px', color: '#e5e7eb' }}>
                    <Heading style={{ color: '#ffffff' }}>Почти готово</Heading>
                    <Text>
                        Подтвердите почту, чтобы публиковать свои авантюрные билды и
                        участвовать в обсуждениях.
                    </Text>
                    <Button
                        href={link}
                        style={{
                            backgroundColor: '#2563eb',
                            borderRadius: '6px',
                            color: '#ffffff',
                            padding: '12px 20px',
                        }}
                    >
                        Подтвердить почту
                    </Button>
                    <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                        Ссылка действует 24 часа. Если вы не регистрировались в
                        BuildVerdict, просто проигнорируйте это письмо.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
