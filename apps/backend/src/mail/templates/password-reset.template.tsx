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

interface PasswordResetEmailProps {
    link: string;
}

export function PasswordResetEmail({ link }: PasswordResetEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Сброс пароля в BuildVerdict</Preview>
            <Body style={{ backgroundColor: '#111827', fontFamily: 'Arial, sans-serif' }}>
                <Container style={{ padding: '32px', color: '#e5e7eb' }}>
                    <Heading style={{ color: '#ffffff' }}>Новый пароль</Heading>
                    <Text>
                        Кто-то запросил сброс пароля для этого адреса. Если это были вы,
                        задайте новый пароль по кнопке ниже.
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
                        Задать новый пароль
                    </Button>
                    <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                        Ссылка действует 1 час. Если вы не запрашивали сброс, ничего
                        делать не нужно — текущий пароль остаётся в силе.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}
